import { getClient, query } from '../db/connection';
import { AppError } from '../middleware/errorHandler';

export interface CancelOrderResult {
  orderId: string;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  stockRestored: boolean;
  restoredItemsCount: number;
  message: string;
}

/**
 * Cancels an order and releases its reserved inventory back to stock.
 *
 * Safety Invariants:
 * 1. An order that has already been successfully paid cannot be cancelled without admin refund process.
 * 2. If an order was already cancelled or stock was already restored, returns idempotent success without double restoration.
 * 3. Atomic transaction with FOR UPDATE locks on both the order row and inventory rows prevents concurrency races.
 * 4. Cancelling an order also cancels any pending uncompleted payment attempts for that order.
 */
export async function cancelOrderAndRestoreStock(
  orderIdOrNumber: string,
  reason: string = 'Order cancelled / payment abandoned'
): Promise<CancelOrderResult> {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Lock the order row
    const orderRes = await client.query<any>(
      `
      SELECT id, order_number, status, payment_status, stock_restored
      FROM orders
      WHERE id = $1 OR order_number = $1
      FOR UPDATE;
      `,
      [orderIdOrNumber]
    );

    if (orderRes.rows.length === 0) {
      throw new AppError(`Order "${orderIdOrNumber}" not found.`, 404);
    }

    const order = orderRes.rows[0];

    // 2. Reject if order is already paid
    if (order.payment_status === 'paid') {
      throw new AppError('Cannot cancel an order that has already been successfully paid.', 400);
    }

    // 3. Idempotent check: If already cancelled and stock restored, return cleanly without duplicate stock addition
    if (order.status === 'cancelled' && order.stock_restored === true) {
      await client.query('COMMIT');
      return {
        orderId: order.id,
        orderNumber: order.order_number,
        previousStatus: order.status,
        newStatus: 'cancelled',
        stockRestored: false,
        restoredItemsCount: 0,
        message: 'Order is already cancelled and stock has already been restored (idempotent).',
      };
    }

    // 4. Fetch order line items to restore inventory
    const itemsRes = await client.query<any>(
      `
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = $1;
      `,
      [order.id]
    );

    let restoredCount = 0;

    // 5. Restore stock for each item if stock has not been restored yet
    if (!order.stock_restored && itemsRes.rows.length > 0) {
      for (const item of itemsRes.rows) {
        if (item.product_id && item.quantity > 0) {
          // Lock inventory row and restore quantity
          await client.query(
            `
            UPDATE inventory
            SET stock_count = stock_count + $1
            WHERE product_id = $2;
            `,
            [item.quantity, item.product_id]
          );
          restoredCount += item.quantity;
        }
      }
    }

    // 6. Update order status and set stock_restored = TRUE
    await client.query(
      `
      UPDATE orders
      SET status = 'cancelled',
          stock_restored = TRUE,
          updated_at = NOW()
      WHERE id = $1;
      `,
      [order.id]
    );

    // 7. Invalidate any pending payment attempts for this order
    await client.query(
      `
      UPDATE payments
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE order_id = $1 AND status = 'pending';
      `,
      [order.id]
    );

    await client.query('COMMIT');

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      previousStatus: order.status,
      newStatus: 'cancelled',
      stockRestored: !order.stock_restored,
      restoredItemsCount: restoredCount,
      message: `Order successfully cancelled. Reason: ${reason}. Inventory restored.`,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export interface ExpireOrdersResult {
  expiredCount: number;
  restoredItemsCount: number;
  expiredOrderNumbers: string[];
}

/**
 * Scans and expires all unpaid pending orders whose expires_at has passed.
 * Uses cancelOrderAndRestoreStock() to ensure atomic, idempotent stock restoration.
 */
export async function expirePendingOrders(): Promise<ExpireOrdersResult> {
  const candidateRes = await query<{ id: string; order_number: string }>(
    `
    SELECT id, order_number
    FROM orders
    WHERE status = 'pending'
      AND payment_status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
      AND stock_restored = FALSE
    ORDER BY expires_at ASC
    LIMIT 100;
    `
  );

  let expiredCount = 0;
  let totalRestoredItems = 0;
  const expiredOrderNumbers: string[] = [];

  for (const row of candidateRes.rows) {
    try {
      const cancelRes = await cancelOrderAndRestoreStock(
        row.id,
        'Order expired automatically due to payment timeout'
      );
      if (cancelRes.stockRestored) {
        expiredCount++;
        totalRestoredItems += cancelRes.restoredItemsCount;
        expiredOrderNumbers.push(row.order_number);
      }
    } catch (err: any) {
      console.error(`[Order Expiry Error] Failed to expire order ${row.order_number}:`, err.message);
    }
  }

  return {
    expiredCount,
    restoredItemsCount: totalRestoredItems,
    expiredOrderNumbers,
  };
}

