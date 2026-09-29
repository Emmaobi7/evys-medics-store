import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getClient, query } from '../db/connection';
import { validate } from '../middleware/validate';
import { AppError } from '../middleware/errorHandler';
import { paystackService } from '../services/paystack';
import { toMinorUnits, isSupportedCurrency } from '../utils/money';

export const paymentsRouter = Router();

const initializePaymentSchema = z.object({
  body: z.object({
    orderId: z.string().trim().min(1, 'Order ID is required'),
    callbackUrl: z.string().url('Invalid callback URL format').optional(),
  }),
});

/**
 * POST /api/v1/payments/initialize
 * Server-side payment initialization using authoritative order amount and currency
 */
paymentsRouter.post(
  '/initialize',
  validate(initializePaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId, callbackUrl } = req.body;

      // 1. Fetch authoritative order from database
      const orderRes = await query<any>(
        'SELECT * FROM orders WHERE id = $1 OR order_number = $1 LIMIT 1;',
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        throw new AppError(`Order with ID "${orderId}" was not found.`, 404);
      }

      const order = orderRes.rows[0];

      // 2. Validate payment state
      if (order.payment_status === 'paid') {
        throw new AppError('This order has already been successfully paid.', 400);
      }

      const currency = order.currency || 'NGN';
      if (!isSupportedCurrency(currency)) {
        throw new AppError(`Unsupported order currency: ${currency}. Primary supported currency is NGN.`, 400);
      }

      const totalAmount = parseFloat(order.grand_total_inc_vat);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        throw new AppError('Invalid order total amount for payment initialization.', 400);
      }

      // 3. Convert authoritative order amount to minor units (kobo for NGN)
      const amountInKobo = toMinorUnits(totalAmount, currency);

      // 4. Generate idempotent payment reference
      const reference = `pstk_${order.order_number}_${Date.now()}`;
      const paymentId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // 5. Initialize with Paystack
      const paystackInit = await paystackService.initializeTransaction({
        email: order.customer_email,
        amountInKobo,
        reference,
        callbackUrl,
        currency,
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
        },
      });

      // 6. Record payment attempt in database
      await query(
        `
        INSERT INTO payments (
          id, order_id, provider, provider_reference, amount, currency, status, payment_data
        )
        VALUES ($1, $2, 'paystack', $3, $4, $5, 'pending', $6);
        `,
        [
          paymentId,
          order.id,
          reference,
          totalAmount.toFixed(2),
          currency,
          JSON.stringify({
            accessCode: paystackInit.accessCode,
            initializedAt: new Date().toISOString(),
          }),
        ]
      );

      res.status(200).json({
        message: 'Payment initialized successfully',
        authorizationUrl: paystackInit.authorizationUrl,
        accessCode: paystackInit.accessCode,
        reference,
        orderId: order.id,
        orderNumber: order.order_number,
        amount: totalAmount,
        currency,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/payments/verify/:reference
 * Authoritative server-side verification of transaction with Paystack
 */
paymentsRouter.get('/verify/:reference', async (req: Request, res: Response, next: NextFunction) => {
  const client = await getClient();
  try {
    const reference = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference;

    if (!reference) {
      throw new AppError('Payment reference is required.', 400);
    }

    // 1. Fetch payment record
    const payRes = await client.query<any>(
      'SELECT * FROM payments WHERE provider_reference = $1 LIMIT 1;',
      [reference]
    );

    if (payRes.rows.length === 0) {
      throw new AppError(`Payment with reference "${reference}" not found.`, 404);
    }

    const payment = payRes.rows[0];

    // 2. Fetch authoritative order
    const orderRes = await client.query<any>(
      'SELECT * FROM orders WHERE id = $1 LIMIT 1;',
      [payment.order_id]
    );

    if (orderRes.rows.length === 0) {
      throw new AppError('Associated order not found for payment.', 404);
    }

    const order = orderRes.rows[0];

    // 3. If already marked as paid in DB, return idempotent success
    if (payment.status === 'paid' && order.payment_status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and processed.',
        status: 'paid',
        reference: payment.provider_reference,
        orderNumber: order.order_number,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        verifiedAt: payment.verified_at,
      });
    }

    const expectedTotal = parseFloat(order.grand_total_inc_vat);
    const expectedKobo = toMinorUnits(expectedTotal, order.currency || 'NGN');

    // 4. Verify transaction with Paystack API
    const verifyResult = await paystackService.verifyTransaction(reference, expectedKobo);

    if (!verifyResult.status || !verifyResult.data) {
      throw new AppError('Payment verification failed on provider.', 400);
    }

    const txData = verifyResult.data;

    // 5. Strict Security Assertions
    if (txData.status !== 'success') {
      await client.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2;', [
        txData.status === 'abandoned' ? 'cancelled' : 'failed',
        payment.id,
      ]);
      throw new AppError(`Payment was not successful. Provider status: ${txData.status}`, 400);
    }

    // Validate Amount (in minor units)
    if (txData.amount !== expectedKobo) {
      await client.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2;', [
        'failed',
        payment.id,
      ]);
      throw new AppError(
        `Payment amount mismatch! Expected ${expectedKobo} kobo, received ${txData.amount} kobo.`,
        400
      );
    }

    // Validate Currency
    if (txData.currency?.toUpperCase() !== (order.currency || 'NGN').toUpperCase()) {
      await client.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2;', [
        'failed',
        payment.id,
      ]);
      throw new AppError(
        `Payment currency mismatch! Expected ${order.currency}, received ${txData.currency}.`,
        400
      );
    }

    // 6. Update payment and order atomically
    await client.query('BEGIN');

    await client.query(
      `
      UPDATE payments
      SET status = 'paid', verified_at = NOW(), updated_at = NOW(), payment_data = $1
      WHERE id = $2;
      `,
      [JSON.stringify(txData), payment.id]
    );

    await client.query(
      `
      UPDATE orders
      SET payment_status = 'paid', updated_at = NOW()
      WHERE id = $1;
      `,
      [order.id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      status: 'paid',
      reference: payment.provider_reference,
      orderNumber: order.order_number,
      amount: expectedTotal,
      currency: order.currency,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
});

/**
 * POST /api/v1/payments/webhook
 * Paystack Webhook endpoint with HMAC SHA512 signature validation and idempotent processing
 */
paymentsRouter.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // 1. Verify Paystack HMAC SHA512 signature
    const isValid = paystackService.verifyWebhookSignature(signature, rawBody);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Paystack webhook signature.' });
    }

    const event = req.body;
    if (event?.event === 'charge.success') {
      const data = event.data;
      const reference = data?.reference;
      const amountInKobo = data?.amount;
      const currency = data?.currency;

      if (reference) {
        const payRes = await query<any>(
          'SELECT * FROM payments WHERE provider_reference = $1 LIMIT 1;',
          [reference]
        );

        if (payRes.rows.length > 0) {
          const payment = payRes.rows[0];
          const orderRes = await query<any>('SELECT * FROM orders WHERE id = $1 LIMIT 1;', [
            payment.order_id,
          ]);

          if (orderRes.rows.length > 0) {
            const order = orderRes.rows[0];
            const expectedKobo = toMinorUnits(parseFloat(order.grand_total_inc_vat), order.currency);

            if (
              amountInKobo === expectedKobo &&
              currency?.toUpperCase() === (order.currency || 'NGN').toUpperCase()
            ) {
              await query(
                `
                UPDATE payments
                SET status = 'paid', verified_at = NOW(), updated_at = NOW(), payment_data = $1
                WHERE id = $2 AND status != 'paid';
                `,
                [JSON.stringify(data), payment.id]
              );

              await query(
                `
                UPDATE orders
                SET payment_status = 'paid', updated_at = NOW()
                WHERE id = $1;
                `,
                [order.id]
              );
            }
          }
        }
      }
    }

    // Always respond with 200 OK to acknowledge webhook receipt
    res.status(200).json({ status: true });
  } catch (error) {
    next(error);
  }
});
