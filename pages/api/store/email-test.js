import { sendOrderConfirmationEmail, sendNewOrderNotificationToAdmin } from "@/services/emailService";

/**
 * Test email endpoint to diagnose email sending issues.
 * DELETE THIS ENDPOINT IN PRODUCTION.
 * GET /api/store/email-test - sends test emails
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Test endpoint not available in production" });
  }

  try {
    const testCustomer = {
      _id: "test-customer-id",
      firstName: "Test",
      lastName: "Customer",
      email: process.env.BUSINESS_NOTIFICATION_EMAIL || process.env.EMAIL_USER,
      phone: "+234800000000",
    };

    const testOrder = {
      _id: "test-order-id",
      orderNumber: "TEST-001",
      total: 50000,
      subtotal: 50000,
      items: [
        {
          _id: "item-1",
          name: "Test Product",
          quantity: 2,
          price: 25000,
          lineTotal: 50000,
        },
      ],
      shippingAddress: {
        street: "123 Test Street",
        city: "Lagos",
        state: "Lagos",
        postalCode: "100001",
        country: "Nigeria",
      },
      paymentMethod: "Test",
      createdAt: new Date(),
    };

    console.log("📧 Attempting to send test emails...");
    console.log("Email credentials:");
    console.log("  EMAIL_USER:", process.env.EMAIL_USER ? "✓ set" : "✗ missing");
    console.log("  EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ set" : "✗ missing");
    console.log("  BUSINESS_NOTIFICATION_EMAIL:", process.env.BUSINESS_NOTIFICATION_EMAIL || process.env.EMAIL_USER);

    // Test customer email
    console.log("\n📤 Sending customer confirmation email...");
    const customerEmailResult = await sendOrderConfirmationEmail(testOrder, testCustomer).catch((err) => {
      console.error("❌ Customer email failed:", err.message);
      throw err;
    });
    if (!customerEmailResult) {
      throw new Error("Customer email was not sent (email service returned false)");
    }
    console.log("✅ Customer email sent successfully");

    // Test admin notification
    console.log("\n📤 Sending admin notification email...");
    const adminEmailResult = await sendNewOrderNotificationToAdmin(testOrder, testCustomer).catch((err) => {
      console.error("❌ Admin email failed:", err.message);
      throw err;
    });
    if (!adminEmailResult) {
      throw new Error("Admin email was not sent (email service returned false)");
    }
    console.log("✅ Admin email sent successfully");

    return res.status(200).json({
      success: true,
      message: "Test emails sent successfully",
      to: testCustomer.email,
      details: {
        customerEmail: "sent",
        adminEmail: "sent",
      },
    });
  } catch (error) {
    console.error("❌ Email test failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString(),
    });
  }
}
