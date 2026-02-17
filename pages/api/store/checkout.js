import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";
import { withCustomerAuth } from "@/utils/customerAuth";
import {
  validateCartForCheckout,
  createOrder,
} from "@/services/orderService";
import { initializePayment } from "@/services/paymentService";

/**
 * Checkout endpoint.
 * POST /api/store/checkout
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  try {
    const customerId = req.customer.id;
    const { shippingAddress, paymentMethod = "Paystack", notes = "" } = req.body;

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      return res.status(400).json({
        error: "Shipping address with street, city, and state is required",
      });
    }

    const cart = await Cart.findOne({ customer: customerId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    const validation = await validateCartForCheckout(cart.items);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Some items in your cart are no longer available",
        details: validation.errors,
      });
    }

    const shippingCost = 0;

    const order = await createOrder({
      customerId,
      items: validation.items,
      shippingAddress,
      paymentMethod,
      notes,
      shippingCost,
    });

    if (paymentMethod === "Paystack") {
      // Use Web_Place's own URL for Paystack callback
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/payment/verify`;

      const payment = await initializePayment({
        orderId: order._id.toString(),
        email: req.customer.email,
        amount: order.total,
        callbackUrl,
        metadata: { customerId },
      });

      return res.status(201).json({
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
        },
        payment: {
          authorizationUrl: payment.authorizationUrl,
          reference: payment.reference,
        },
      });
    }

    res.status(201).json({
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentMethod,
      },
      message:
        paymentMethod === "Bank Transfer"
          ? "Please complete the bank transfer. Your order will be processed once payment is confirmed."
          : "Your order has been placed. Payment will be collected on delivery.",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: error.message || "Checkout failed" });
  }
}

export default withCustomerAuth(handler);
