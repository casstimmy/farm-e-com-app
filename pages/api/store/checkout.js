import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Customer from "@/models/Customer";
import { withCustomerAuth } from "@/utils/customerAuth";
import {
  validateCartForCheckout,
  createOrder,
} from "@/services/orderService";
import { initializePayment } from "@/services/paymentService";
import { withRateLimit } from "@/lib/rateLimit";

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
    const { shippingAddress, paymentMethod = "Paystack", notes: rawNotes = "" } = req.body;

    // Validate paymentMethod against allowed values (must match Order model enum)
    const ALLOWED_PAYMENT_METHODS = ["Paystack", "Bank Transfer", "Cash on Delivery"];
    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Sanitize and limit notes
    const notes = typeof rawNotes === "string" ? rawNotes.trim().slice(0, 500) : "";

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      return res.status(400).json({
        error: "Shipping address with street, city, and state is required",
      });
    }

    // Validate shipping address field lengths
    const MAX_ADDR_LEN = 200;
    for (const field of ["street", "city", "state", "postalCode", "country"]) {
      if (shippingAddress[field] && String(shippingAddress[field]).length > MAX_ADDR_LEN) {
        return res.status(400).json({ error: `Address ${field} is too long (max ${MAX_ADDR_LEN} chars)` });
      }
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

    // Persist checkout address into customer profile if it's new.
    const customer = await Customer.findById(customerId);
    if (customer) {
      const normalized = {
        street: shippingAddress.street?.trim().slice(0, 200) || "",
        city: shippingAddress.city?.trim().slice(0, 200) || "",
        state: shippingAddress.state?.trim().slice(0, 200) || "",
        postalCode: shippingAddress.postalCode?.trim().slice(0, 20) || "",
        country: shippingAddress.country?.trim().slice(0, 100) || "Nigeria",
      };
      const addresses = customer.addresses || [];
      // Limit total addresses stored
      if (addresses.length >= 10) {
        // Don't add more, just continue
      } else {
        const exists = addresses.some(
          (a) =>
            a.street === normalized.street &&
            a.city === normalized.city &&
            a.state === normalized.state &&
            (a.postalCode || "") === normalized.postalCode
        );
        if (!exists && normalized.street && normalized.city && normalized.state) {
          addresses.push({
            label: "Checkout Address",
            ...normalized,
            isDefault: addresses.length === 0,
          });
          customer.addresses = addresses;
          await customer.save();
        }
      }
    }

    if (paymentMethod === "Paystack") {
      // Use Web_Place's own URL for Paystack callback
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/payment/verify`;

      try {
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
      } catch (payErr) {
        console.error("Paystack initialization failed:", payErr);
        // Order was created but payment init failed — don't lose the order.
        // Return order info so the customer can retry payment.
        return res.status(201).json({
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
          },
          paymentError: "Payment gateway is temporarily unavailable. Your order has been placed — you can complete payment from your orders page.",
        });
      }
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
    res.status(500).json({ error: "Checkout failed. Please try again." });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-checkout",
    methods: ["POST"],
    windowMs: 60 * 1000,
    max: 20,
  },
  withCustomerAuth(handler)
);
