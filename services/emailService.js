import nodemailer from "nodemailer";

/**
 * Email Service
 * Handles all email operations using Nodemailer
 */

const EMAIL_USER = process.env.EMAIL_USER?.trim();
const EMAIL_PASS = process.env.EMAIL_PASS?.trim();
const BUSINESS_NOTIFICATION_EMAIL = process.env.BUSINESS_NOTIFICATION_EMAIL?.trim();
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Farm Fresh Store";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://farm-e-com-app.vercel.app";
const ADMIN_APP_URL = process.env.ADMIN_APP_URL || "https://farm-health-app.vercel.app";
const CUSTOMER_ORDERS_URL = `${APP_URL.replace(/\/$/, "")}/account/orders`;
const ADMIN_ORDERS_URL = `${ADMIN_APP_URL.replace(/\/$/, "")}/manage/orders`;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️  Email credentials not configured. Email service will not work.");
}

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Lazy-initialize transporter only when needed
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  if (!EMAIL_USER || !EMAIL_PASS) {
    const msg = "Email credentials not configured in environment variables";
    console.error("❌", msg);
    throw new Error(msg);
  }
  try {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    console.log("✅ Email transporter initialized for", EMAIL_USER);
    return _transporter;
  } catch (error) {
    console.error("❌ Failed to initialize email transporter:", error.message);
    throw error;
  }
}

/**
 * Verify transporter connection (optional, useful for debugging)
 */
export async function verifyEmailConnection() {
  if (!EMAIL_USER || !EMAIL_PASS) return false;
  try {
    await getTransporter().verify();
    console.log("Email service ready");
    return true;
  } catch (error) {
    console.error("Email service error:", error.message);
    return false;
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(order, customer) {
  const { orderNumber, total, items, shippingAddress, createdAt } = order;
  
  // Escape user-provided data
  const safeFirstName = escapeHtml(customer.firstName);
  const safeLastName = escapeHtml(customer.lastName);
  const safePhone = escapeHtml(customer.phone);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeStreet = escapeHtml(shippingAddress?.street);
  const safeCity = escapeHtml(shippingAddress?.city);
  const safeState = escapeHtml(shippingAddress?.state);
  const safePostalCode = escapeHtml(shippingAddress?.postalCode);
  const safeCountry = escapeHtml(shippingAddress?.country);

  const itemsList = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₦${item.lineTotal.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #16a34a; }
        .order-info h3 { margin-top: 0; color: #16a34a; }
        .order-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .detail-item { background: white; padding: 12px; border-radius: 4px; }
        .detail-label { color: #666; font-size: 12px; text-transform: uppercase; }
        .detail-value { font-weight: bold; color: #333; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; color: #333; }
        .summary { background: white; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .summary-row.total { font-size: 18px; font-weight: bold; color: #16a34a; border: none; padding-top: 12px; }
        .shipping-address { background: white; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .shipping-address h4 { margin-top: 0; color: #333; }
        .address-text { margin: 8px 0; color: #666; line-height: 1.6; }
        .cta-button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Order Confirmed</h1>
          <p style="margin: 10px 0 0 0;">Thank you for your purchase</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${safeFirstName},<br>
            Thank you for shopping with ${APP_NAME}. Your order is confirmed and our team has started processing it.
          </p>

          <div class="order-info">
            <h3>Order Details</h3>
            <div class="order-details">
              <div class="detail-item">
                <div class="detail-label">Order Number</div>
                <div class="detail-value">#${safeOrderNumber}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Order Date</div>
                <div class="detail-value">${new Date(createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <h3 style="color: #333; margin-bottom: 10px;">Items Ordered</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>₦${items.reduce((sum, item) => sum + item.lineTotal, 0).toLocaleString()}</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>₦${total.toLocaleString()}</span>
            </div>
          </div>

          <div class="shipping-address">
            <h4>Shipping Address</h4>
            <div class="address-text">
              ${safeFirstName} ${safeLastName}<br>
              ${safeStreet}<br>
              ${safeCity}, ${safeState} ${safePostalCode}<br>
              ${safeCountry}<br>
              📞 ${safePhone || "Not provided"}
            </div>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            You can check delivery progress and payment status anytime from your orders page.
          </p>

          <a href="${CUSTOMER_ORDERS_URL}" class="cta-button">Track My Order</a>

          <p style="margin-top: 30px; font-size: 13px; color: #999;">
            If you have any questions, please contact our support team.<br>
            <strong>${APP_NAME}</strong>
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          <p>This is an automated message - please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `${safeFirstName}, your order #${orderNumber} is confirmed ✅`,
      html,
    });
    console.log(`Order confirmation email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    return false;
  }
}

/**
 * Send order shipment notification
 */
export async function sendShipmentNotificationEmail(order, customer, trackingInfo) {
  const { orderNumber, items } = order;
  const safeFirstName = escapeHtml(customer.firstName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const itemsList = items
    .map((item) => `<li>${escapeHtml(item.name)} (x${item.quantity})</li>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .tracking-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #16a34a; margin: 20px 0; }
        .tracking-number { font-size: 18px; font-weight: bold; color: #16a34a; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <p>Hi ${safeFirstName},</p>
          <p>Great news! Your order #${safeOrderNumber} is on its way to you.</p>
          
          <div class="tracking-box">
            <h3 style="margin-top: 0;">Tracking Information</h3>
            <p><strong>Tracking Number:</strong></p>
            <div class="tracking-number">${escapeHtml(trackingInfo?.trackingNumber) || "N/A"}</div>
            ${trackingInfo?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${escapeHtml(trackingInfo.estimatedDelivery)}</p>` : ""}
          </div>

          <h4>Items in this shipment:</h4>
          <ul>${itemsList}</ul>

          <p style="margin-top: 30px;">You can track your shipment using the tracking number above.</p>
          <p style="color: #999; font-size: 12px;">Thank you for your order!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `Your Order #${orderNumber} Has Shipped - Tracking Info Included`,
      html,
    });
    console.log(`Shipment notification email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send shipment notification email:", error);
    return false;
  }
}

/**
 * Send order delivery confirmation
 */
export async function sendDeliveryConfirmationEmail(order, customer) {
  const { orderNumber } = order;
  const safeFirstName = escapeHtml(customer.firstName);
  const safeOrderNumber = escapeHtml(orderNumber);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0; text-align: center; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
        .cta { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Delivery Confirmed</h1>
        </div>
        <div class="content">
          <p>Hi ${safeFirstName},</p>
          <p>Your order has been delivered successfully!</p>
          
          <div class="success-box">
            <div class="success-icon">✓</div>
            <h2 style="color: #10b981; margin: 0;">Order #${safeOrderNumber}</h2>
            <p style="color: #666; margin: 5px 0;">Delivery complete</p>
          </div>

          <p>Thank you for shopping with us! We hope you enjoy your purchase.</p>
          <p>If you have any issues or questions about your order, please don't hesitate to contact us.</p>

          <a href="${APP_URL}/account" class="cta">View Your Account</a>

          <p style="margin-top: 30px; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} ${APP_NAME}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `Your Order #${orderNumber} Has Been Delivered`,
      html,
    });
    console.log(`Delivery confirmation email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send delivery confirmation email:", error);
    return false;
  }
}

/**
 * Send customer registration welcome email
 */
export async function sendWelcomeEmail(customer) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .feature { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${APP_NAME}!</h1>
        </div>
        <div class="content">
          <p>Hi ${escapeHtml(customer.firstName)},</p>
          <p>Welcome to ${APP_NAME}! We're excited to have you on board.</p>
          
          <h3>Here's what you can do:</h3>
          <div class="feature">
            <strong>🛍️ Shop Our Products</strong> - Browse and purchase fresh items
          </div>
          <div class="feature">
            <strong>📦 Track Orders</strong> - Monitor your purchases in real-time
          </div>
          <div class="feature">
            <strong>💰 Exclusive Deals</strong> - Get special offers and discounts
          </div>
          <div class="feature">
            <strong>🐾 Learn About Our Farm</strong> - Read about our animals and practices
          </div>

          <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
          <p style="color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} ${APP_NAME}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `Welcome to ${APP_NAME}!`,
      html,
    });
    console.log(`Welcome email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(customer, code) {
  const safeFirstName = escapeHtml(customer.firstName);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; border: 2px dashed #16a34a; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a; font-family: monospace; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Hi ${safeFirstName},</p>
          <p>Thank you for creating an account with ${APP_NAME}. Please use the code below to verify your email address:</p>
          
          <div class="code-box">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Your verification code</p>
            <div class="code">${escapeHtml(code)}</div>
          </div>

          <p style="color: #666; font-size: 14px;">This code expires in <strong>30 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `${code} is your ${APP_NAME} verification code`,
      html,
    });
    console.log(`Verification email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

/**
 * Send password reset code
 */
export async function sendResetPasswordEmail(customer, code) {
  const safeFirstName = escapeHtml(customer.firstName);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .code-box { background: white; border: 2px dashed #dc2626; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #dc2626; font-family: monospace; }
        .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${safeFirstName},</p>
          <p>We received a request to reset the password for your ${APP_NAME} account. Use the code below to set a new password:</p>
          
          <div class="code-box">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Your password reset code</p>
            <div class="code">${escapeHtml(code)}</div>
          </div>

          <p style="color: #666; font-size: 14px;">This code expires in <strong>30 minutes</strong>.</p>

          <div class="warning">
            <strong>Didn't request this?</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>

          <div class="footer">
            <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `${code} is your ${APP_NAME} password reset code`,
      html,
    });
    console.log(`Password reset email sent to ${customer.email}`);
    return true;
  } catch (error) {
    console.error("Failed to send reset email:", error);
    return false;
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationEmail(customer, code) {
  return sendVerificationEmail(customer, code);
}

/**
 * Send new order notification email to the business admin.
 * Includes order summary so the business knows immediately.
 */
export async function sendNewOrderNotificationToAdmin(order, customer) {
  const businessEmail = BUSINESS_NOTIFICATION_EMAIL || EMAIL_USER;
  if (!businessEmail) return false;

  const { orderNumber, total, items, paymentMethod, shippingAddress, createdAt } = order;
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeCustomerName = escapeHtml(`${customer.firstName} ${customer.lastName}`);
  const safeEmail = escapeHtml(customer.email);
  const safePhone = escapeHtml(customer.phone || "Not provided");
  const safeStreet = escapeHtml(shippingAddress?.street);
  const safeCity = escapeHtml(shippingAddress?.city);
  const safeState = escapeHtml(shippingAddress?.state);

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.lineTotal || 0).toLocaleString()}</td>
        </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #16a34a; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">🛒 New Customer Order Alert</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Order #${safeOrderNumber} is ready for review</p>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 14px 0; font-size: 14px; color: #4b5563;">
            Hello Team, a new order was placed on ${APP_NAME}. Please review and process it from the admin dashboard.
          </p>
          <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #16a34a;">
            <h3 style="margin: 0 0 8px 0; color: #16a34a;">Order Summary</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Date:</strong> ${new Date(createdAt).toLocaleString("en-NG")}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Payment:</strong> ${escapeHtml(paymentMethod)}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Total:</strong> <span style="font-size: 18px; color: #16a34a; font-weight: bold;">₦${(total || 0).toLocaleString()}</span></p>
          </div>

          <div style="background: white; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0;">Customer</h4>
            <p style="margin: 4px 0; font-size: 14px;">${safeCustomerName}</p>
            <p style="margin: 4px 0; font-size: 14px;">📧 ${safeEmail}</p>
            <p style="margin: 4px 0; font-size: 14px;">📞 ${safePhone}</p>
            <p style="margin: 4px 0; font-size: 14px;">📍 ${safeStreet}, ${safeCity}, ${safeState}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px;">Item</th>
                <th style="padding: 8px 12px; text-align: center; font-size: 13px;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; font-size: 13px;">Total</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div style="text-align: center; margin-top: 20px;">
            <a href="${ADMIN_ORDERS_URL}" style="display: inline-block; background: #16a34a; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Open Admin Order Queue</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await getTransporter().sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: businessEmail,
      subject: `Admin Alert: New order #${orderNumber} from ${customer.firstName} ${customer.lastName}`,
      html,
    });
    console.log(`Admin order notification sent to ${businessEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send admin order notification:", error);
    return false;
  }
}

export default { getTransporter, verifyEmailConnection };
