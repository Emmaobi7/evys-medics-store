import nodemailer from 'nodemailer';
import { query } from '../db/connection';
import { config } from '../config/env';
import { formatNaira } from '../utils/money';

export interface SendOrderEmailResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  orderNumber: string;
  mode: 'smtp' | 'console_logged';
}

/**
 * Configure Nodemailer transport if SMTP settings are present in env
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Sends a rich order payment confirmation email to the customer upon successful Paystack settlement
 */
export async function sendOrderPaymentConfirmationEmail(
  orderIdOrNumber: string,
  paystackReference?: string
): Promise<SendOrderEmailResult> {
  try {
    // 1. Fetch order details
    const orderRes = await query<any>(
      `
      SELECT id, order_number, customer_name, customer_email, customer_phone,
             shipping_address_line1, shipping_city, shipping_postcode, shipping_country,
             subtotal_ex_vat, delivery_fee, grand_total_inc_vat, currency, payment_status, created_at
      FROM orders
      WHERE id = $1 OR order_number = $1
      LIMIT 1;
      `,
      [orderIdOrNumber]
    );

    if (orderRes.rows.length === 0) {
      console.warn(`[Email Service] Order not found for email notification: ${orderIdOrNumber}`);
      return {
        success: false,
        recipient: '',
        orderNumber: orderIdOrNumber,
        mode: 'console_logged',
      };
    }

    const order = orderRes.rows[0];

    // 2. Fetch line items
    const itemsRes = await query<any>(
      `
      SELECT sku_snapshot, product_name_snapshot, unit_price_ex_vat, quantity, line_total_ex_vat
      FROM order_items
      WHERE order_id = $1;
      `,
      [order.id]
    );

    const items = itemsRes.rows;
    const recipient = order.customer_email;
    const orderNumber = order.order_number;
    const totalFormatted = formatNaira(parseFloat(order.grand_total_inc_vat));
    const subtotalFormatted = formatNaira(parseFloat(order.subtotal_ex_vat));
    const deliveryFormatted = parseFloat(order.delivery_fee) > 0 ? formatNaira(parseFloat(order.delivery_fee)) : '₦0.00 (Standard)';
    const fromAddress = process.env.EMAIL_FROM || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@') ? `Evy's Medics Store <${process.env.SMTP_USER}>` : 'Evy\'s Medics Store <admin@evysmedics.co.uk>');

    // Build items HTML table
    const itemsHtml = items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 8px; font-weight: 600; color: #0F172A;">
            ${item.product_name_snapshot}
            <div style="font-size: 12px; color: #64748B; font-family: monospace;">SKU: ${item.sku_snapshot}</div>
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #334155;">${item.quantity}</td>
          <td style="padding: 12px 8px; text-align: right; color: #334155;">${formatNaira(parseFloat(item.unit_price_ex_vat))}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #0F172A;">${formatNaira(parseFloat(item.line_total_ex_vat))}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - ${orderNumber}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #012EA2; padding: 28px 32px; text-align: center; color: #FFFFFF;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">EVY'S MEDICS STORE</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Order Payment & Confirmation Receipt</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
                <span style="font-size: 14px; font-weight: 700; color: #15803D; text-transform: uppercase;">Payment Confirmed via Paystack</span>
                <h2 style="margin: 6px 0 0 0; font-size: 20px; color: #14532D;">Thank You, ${order.customer_name}!</h2>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                We have received your payment for order <strong>${orderNumber}</strong>. Your medical supplies have been allocated and queued for dispatch.
              </p>

              <!-- Order Metadata -->
              <table width="100%" style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Order Number:</td>
                  <td style="padding: 4px 0; font-weight: 700; font-family: monospace; text-align: right;">${orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Paystack Reference:</td>
                  <td style="padding: 4px 0; font-family: monospace; font-size: 12px; text-align: right;">${paystackReference || 'Verified'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #64748B;">Delivery Destination:</td>
                  <td style="padding: 4px 0; font-weight: 600; text-align: right;">${order.shipping_address_line1}, ${order.shipping_city} (${order.shipping_postcode})</td>
                </tr>
              </table>

              <!-- Order Line Items -->
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px;">Order Items</h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; font-size: 14px;">
                <thead>
                  <tr style="background-color: #F1F5F9; text-align: left; color: #475569;">
                    <th style="padding: 8px;">Item</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Price</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <table width="100%" style="font-size: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Items Subtotal:</td>
                  <td style="text-align: right; font-weight: 600; color: #334155;">${subtotalFormatted}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Delivery Fee:</td>
                  <td style="text-align: right; font-weight: 600; color: #334155;">${deliveryFormatted}</td>
                </tr>
                <tr style="border-top: 2px dashed #CBD5E1; font-size: 18px; font-weight: 800;">
                  <td style="padding-top: 10px; color: #0F172A;">Total Paid (Tax-Inclusive):</td>
                  <td style="padding-top: 10px; text-align: right; color: #012EA2;">${totalFormatted}</td>
                </tr>
              </table>

              <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; font-size: 13px; color: #64748B; line-height: 1.5;">
                <strong>Need Support?</strong> If you have questions regarding dispatch or technical documentation, contact support at <a href="mailto:support@evysmedics.co.uk" style="color: #012EA2; text-decoration: none;">support@evysmedics.co.uk</a>.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; color: #94A3B8; padding: 20px 32px; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Evy's Medics Store. All rights reserved. Professional Healthcare & Medical Supplies.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
EVY'S MEDICS STORE — ORDER CONFIRMATION
========================================
Order Number: ${orderNumber}
Customer: ${order.customer_name} (${order.customer_email})
Paystack Reference: ${paystackReference || 'Verified'}
Destination: ${order.shipping_address_line1}, ${order.shipping_city}, ${order.shipping_country}

ITEMS PURCHASED:
${items.map((i) => `- ${i.product_name_snapshot} (Qty: ${i.quantity}) - ${formatNaira(parseFloat(i.line_total_ex_vat))}`).join('\n')}

Subtotal: ${subtotalFormatted}
Delivery Fee: ${deliveryFormatted}
Total Settled: ${totalFormatted}

Your order has been recorded and queued for warehouse picking and dispatch.
Thank you for shopping with Evy's Medics Store.
    `.trim();

    const transporter = getEmailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject: `Order Confirmation - ${orderNumber} | Evy's Medics`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service] Sent confirmation email via SMTP to ${recipient} (Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        recipient,
        orderNumber,
        mode: 'smtp',
      };
    } else {
      console.log(`\n========================================================`);
      console.log(`📧 [EMAIL DISPATCH SIMULATION] Order Payment Confirmation`);
      console.log(`To: ${recipient}`);
      console.log(`Subject: Order Confirmation - ${orderNumber} | Evy's Medics`);
      console.log(`Total: ${totalFormatted} (Ref: ${paystackReference || 'Verified'})`);
      console.log(`Items Count: ${items.length}`);
      console.log(`========================================================\n`);

      return {
        success: true,
        recipient,
        orderNumber,
        mode: 'console_logged',
      };
    }
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send order email for ${orderIdOrNumber}:`, error.message);
    return {
      success: false,
      recipient: '',
      orderNumber: orderIdOrNumber,
      mode: 'console_logged',
    };
  }
}

export interface SendResetEmailResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  mode: 'smtp' | 'console_logged';
}

/**
 * Sends a secure password reset email with a verification link and expiration notice
 */
export async function sendPasswordResetEmail(
  recipientEmail: string,
  resetToken: string,
  resetUrl: string
): Promise<SendResetEmailResult> {
  try {
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')
        ? `Evy's Medics Store <${process.env.SMTP_USER}>`
        : 'Evy\'s Medics Store <admin@evysmedics.co.uk>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Evy's Medics</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #012EA2; padding: 28px 32px; text-align: center; color: #FFFFFF;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">EVY'S MEDICS STORE</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0F172A;">Hello,</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                We received a request to reset the password for your Evy's Medics Store account associated with <strong>${recipientEmail}</strong>.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background-color: #012EA2; color: #FFFFFF; padding: 14px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(1, 46, 162, 0.2);">
                  Reset Your Password
                </a>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #64748B; margin-bottom: 16px;">
                Or copy and paste this link into your browser:
                <br>
                <a href="${resetUrl}" style="color: #012EA2; word-break: break-all; font-size: 13px;">${resetUrl}</a>
              </p>

              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-top: 24px; font-size: 13px; color: #92400E; line-height: 1.5;">
                <strong>Security Notice:</strong> This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email; your account remains secure.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; color: #94A3B8; padding: 20px 32px; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Evy's Medics Store. Professional Healthcare & Medical Supplies.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
EVY'S MEDICS STORE — PASSWORD RESET
====================================
We received a request to reset the password for ${recipientEmail}.

To reset your password, visit the following link:
${resetUrl}

This link will expire in 1 hour. If you did not request this, please ignore this email.
    `.trim();

    const transporter = getEmailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: "Reset Your Password | Evy's Medics",
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service] Sent password reset email via SMTP to ${recipientEmail} (Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        recipient: recipientEmail,
        mode: 'smtp',
      };
    } else {
      console.log(`\n========================================================`);
      console.log(`📧 [EMAIL DISPATCH SIMULATION] Password Reset`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`Token: ${resetToken}`);
      console.log(`========================================================\n`);

      return {
        success: false,
        recipient: recipientEmail,
        mode: 'console_logged',
      };
    }
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send password reset email to ${recipientEmail}:`, error.message);
    return {
      success: false,
      recipient: recipientEmail,
      mode: 'console_logged',
    };
  }
}

export interface SendInquiryReplyResult {
  success: boolean;
  messageId?: string;
  recipient: string;
  mode: 'smtp' | 'console_logged';
}

/**
 * Sends a clinical enquiry response email directly to the customer's mailbox
 */
export async function sendInquiryReplyEmail(
  recipientEmail: string,
  customerName: string,
  subject: string,
  replyMessage: string,
  originalMessage?: string
): Promise<SendInquiryReplyResult> {
  try {
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')
        ? `Evy's Medics Store <${process.env.SMTP_USER}>`
        : 'Evy\'s Medics Store <admin@evysmedics.co.uk>');

    const emailSubject = subject || `Response to Your Inquiry — Evy's Medics Store`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; color: #0F172A;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #012EA2; padding: 28px 32px; text-align: center; color: #FFFFFF;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">EVY'S MEDICS STORE</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Clinical & Procurement Support</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0F172A;">Hello ${customerName || 'Valued Customer'},</h2>
              
              <div style="font-size: 15px; line-height: 1.7; color: #334155; margin-bottom: 24px; white-space: pre-wrap;">
${replyMessage}
              </div>

              ${
                originalMessage
                  ? `
              <div style="background-color: #F1F5F9; border-left: 4px solid #012EA2; padding: 14px 16px; margin-top: 24px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 6px;">Your Original Inquiry</div>
                <div style="font-size: 13px; color: #475569; font-style: italic; line-height: 1.5; white-space: pre-wrap;">${originalMessage}</div>
              </div>
              `
                  : ''
              }

              <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B; line-height: 1.5;">
                <strong>Evy's Medics Specialist Support Team</strong><br>
                For direct orders and emergency supplies: <a href="mailto:admin@evysmedics.co.uk" style="color: #012EA2; text-decoration: none;">admin@evysmedics.co.uk</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; color: #94A3B8; padding: 20px 32px; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Evy's Medics Store. Professional Healthcare & Medical Supplies.
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `
EVY'S MEDICS STORE — SPECIALIST RESPONSE
========================================
Hello ${customerName || 'Valued Customer'},

${replyMessage}

----------------------------------------
${originalMessage ? `Your Original Inquiry:\n${originalMessage}\n` : ''}
Best regards,
Evy's Medics Support Team
admin@evysmedics.co.uk
    `.trim();

    const transporter = getEmailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: emailSubject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email Service] Sent inquiry reply email via SMTP to ${recipientEmail} (Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        recipient: recipientEmail,
        mode: 'smtp',
      };
    } else {
      console.log(`\n========================================================`);
      console.log(`📧 [EMAIL DISPATCH SIMULATION] Inquiry Reply`);
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Message: ${replyMessage}`);
      console.log(`========================================================\n`);

      return {
        success: true,
        recipient: recipientEmail,
        mode: 'console_logged',
      };
    }
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send inquiry reply email to ${recipientEmail}:`, error.message);
    return {
      success: false,
      recipient: recipientEmail,
      mode: 'console_logged',
    };
  }
}


