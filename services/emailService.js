import nodemailer from "nodemailer";

/**
 * Email Service
 * Handles all email operations using Nodemailer
 */

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Farm Fresh Store";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("Email credentials not configured. Email service will not work.");
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Verify transporter connection (optional, useful for debugging)
 */
export async function verifyEmailConnection() {
  if (!EMAIL_USER || !EMAIL_PASS) return false;
  try {
    await transporter.verify();
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
  
  const itemsList = items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
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
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-info { background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #667eea; }
        .order-info h3 { margin-top: 0; color: #667eea; }
        .order-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .detail-item { background: white; padding: 12px; border-radius: 4px; }
        .detail-label { color: #666; font-size: 12px; text-transform: uppercase; }
        .detail-value { font-weight: bold; color: #333; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: 600; color: #333; }
        .summary { background: white; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .summary-row.total { font-size: 18px; font-weight: bold; color: #667eea; border: none; padding-top: 12px; }
        .shipping-address { background: white; padding: 20px; border-radius: 6px; margin-top: 20px; }
        .shipping-address h4 { margin-top: 0; color: #333; }
        .address-text { margin: 8px 0; color: #666; line-height: 1.6; }
        .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: 600; }
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
            Hi ${customer.firstName},<br>
            Your order has been confirmed and is being processed. Below are the details of your order.
          </p>

          <div class="order-info">
            <h3>Order Details</h3>
            <div class="order-details">
              <div class="detail-item">
                <div class="detail-label">Order Number</div>
                <div class="detail-value">#${orderNumber}</div>
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
              ${customer.firstName} ${customer.lastName}<br>
              ${shippingAddress.street}<br>
              ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br>
              ${shippingAddress.country}<br>
              📞 ${customer.phone || "Not provided"}
            </div>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            You can track your order status at any time by visiting your account page.
          </p>

          <a href="${APP_URL}/account/orders" class="cta-button">View My Orders</a>

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
    await transporter.sendMail({
      from: `"${APP_NAME}" <${EMAIL_USER}>`,
      to: customer.email,
      subject: `Order Confirmation - #${orderNumber}`,
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
  const itemsList = items
    .map((item) => `<li>${item.name} (x${item.quantity})</li>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .tracking-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 20px 0; }
        .tracking-number { font-size: 18px; font-weight: bold; color: #667eea; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.firstName},</p>
          <p>Great news! Your order #${orderNumber} is on its way to you.</p>
          
          <div class="tracking-box">
            <h3 style="margin-top: 0;">Tracking Information</h3>
            <p><strong>Tracking Number:</strong></p>
            <div class="tracking-number">${trackingInfo?.trackingNumber || "N/A"}</div>
            ${trackingInfo?.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery}</p>` : ""}
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
    await transporter.sendMail({
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
  const { orderNumber, total } = order;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0; text-align: center; }
        .success-icon { font-size: 48px; margin-bottom: 10px; }
        .cta { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Delivery Confirmed</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.firstName},</p>
          <p>Your order has been delivered successfully!</p>
          
          <div class="success-box">
            <div class="success-icon">✓</div>
            <h2 style="color: #10b981; margin: 0;">Order #${orderNumber}</h2>
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
    await transporter.sendMail({
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
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
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
          <p>Hi ${customer.firstName},</p>
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
    await transporter.sendMail({
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

export default transporter;
