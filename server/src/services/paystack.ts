import crypto from 'crypto';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface PaystackInitParams {
  email: string;
  amountInKobo: number; // e.g. 500000 kobo = 5000.00 NGN
  reference: string;
  callbackUrl?: string;
  currency?: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitResponse {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    domain?: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number; // in kobo
    currency: string;
    gateway_response?: string;
    paid_at?: string;
    created_at?: string;
    channel?: string;
    ip_address?: string;
    metadata?: Record<string, any>;
    customer?: {
      id?: number;
      email?: string;
      customer_code?: string;
    };
  };
}

class PaystackService {
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = config.paystack.secretKey;
    this.baseUrl = config.paystack.baseUrl;
  }

  private isLiveOrTestApiKey(): boolean {
    return Boolean(this.secretKey && (this.secretKey.startsWith('sk_live_') || this.secretKey.startsWith('sk_test_')));
  }

  /**
   * Initializes a Paystack transaction
   * Generates authorization URL for redirect/popup checkout
   */
  async initializeTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
    const { email, amountInKobo, reference, callbackUrl, currency = 'NGN', metadata } = params;

    if (!amountInKobo || amountInKobo <= 0) {
      throw new AppError('Invalid payment amount. Amount in kobo must be greater than 0.', 400);
    }

    // Call live/sandbox Paystack API if key is provided and not simulated
    if (this.isLiveOrTestApiKey() && !this.secretKey.includes('mock')) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: amountInKobo,
            reference,
            callback_url: callbackUrl || config.paystack.callbackUrl,
            currency: currency.toUpperCase(),
            metadata,
          }),
        });

        const data = (await response.json()) as any;
        if (!response.ok || !data.status) {
          throw new AppError(
            data.message || 'Failed to initialize Paystack transaction.',
            response.status >= 400 && response.status < 500 ? 400 : 502
          );
        }

        return {
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference,
        };
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Paystack Initialization Error: ${err.message}`, 502);
      }
    }

    // Development / Sandbox Simulated Mode (Deterministic Paystack mock for offline & automated testing)
    const accessCode = `acc_${crypto.randomBytes(8).toString('hex')}`;
    const authorizationUrl = `https://checkout.paystack.com/${accessCode}`;

    return {
      authorizationUrl,
      accessCode,
      reference,
    };
  }

  /**
   * Verifies a Paystack transaction by reference
   * Returns complete transaction data for authoritative validation
   */
  async verifyTransaction(reference: string, simulatedAmountInKobo?: number): Promise<PaystackVerifyResponse> {
    if (!reference) {
      throw new AppError('Transaction reference is required for verification.', 400);
    }

    if (this.isLiveOrTestApiKey() && !this.secretKey.includes('mock')) {
      try {
        const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const data = (await response.json()) as PaystackVerifyResponse;
        if (!response.ok) {
          throw new AppError(data.message || 'Paystack verification failed.', 400);
        }

        return data;
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        throw new AppError(`Paystack Verification Network Error: ${err.message}`, 502);
      }
    }

    // Simulated Verification for Development / Automated Test Suite
    return {
      status: true,
      message: 'Verification successful',
      data: {
        id: Math.floor(Math.random() * 1000000),
        status: 'success',
        reference,
        amount: simulatedAmountInKobo || 0,
        currency: 'NGN',
        gateway_response: 'Successful',
        paid_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        channel: 'card',
      },
    };
  }

  /**
   * Verifies Paystack Webhook HMAC SHA512 Signature
   */
  verifyWebhookSignature(signature: string | undefined, rawBody: string | Buffer): boolean {
    if (!signature || !this.secretKey) {
      return false;
    }

    try {
      const payloadBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
      const computedHash = crypto
        .createHmac('sha512', this.secretKey)
        .update(payloadBuffer)
        .digest('hex');

      if (signature.length !== computedHash.length) {
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(computedHash, 'utf8')
      );
    } catch {
      return false;
    }
  }
}

export const paystackService = new PaystackService();
