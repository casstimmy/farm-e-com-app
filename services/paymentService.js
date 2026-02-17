import Transaction from "@/models/Transaction";
import { confirmOrderPayment } from "./orderService";

/**
 * Payment Service
 *
 * Handles Paystack payment initialization, verification, and webhook
 * processing.
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

/**
 * Initialize a Paystack transaction.
 */
export async function initializePayment({
  orderId,
  email,
  amount,
  currency = "NGN",
  callbackUrl,
  metadata = {},
}) {
  const reference = `txn_${orderId}_${Date.now()}`;

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Paystack expects kobo
      currency,
      reference,
      callback_url: callbackUrl,
      metadata: {
        orderId,
        ...metadata,
      },
    }),
  });

  const data = await response.json();

  if (!data.status) {
    throw new Error(data.message || "Failed to initialize payment");
  }

  // Create pending transaction record
  await Transaction.create({
    order: orderId,
    customer: metadata.customerId,
    reference,
    provider: "Paystack",
    amount,
    currency,
    status: "Pending",
    metadata: { paystackAccessCode: data.data.access_code },
  });

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference,
  };
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPayment(reference) {
  const transaction = await Transaction.findOne({ reference });
  if (!transaction) throw new Error("Transaction not found");

  if (transaction.status === "Success") {
    return { alreadyVerified: true, transaction };
  }

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();

  if (!data.status) {
    transaction.status = "Failed";
    transaction.failureReason = data.message || "Verification failed";
    await transaction.save();
    return { success: false, transaction, reason: transaction.failureReason };
  }

  const paystackData = data.data;

  if (paystackData.status === "success") {
    // Verify amount matches (in kobo)
    const expectedKobo = Math.round(transaction.amount * 100);
    if (paystackData.amount !== expectedKobo) {
      transaction.status = "Failed";
      transaction.failureReason = `Amount mismatch: expected ${expectedKobo}, got ${paystackData.amount}`;
      await transaction.save();
      return { success: false, transaction, reason: transaction.failureReason };
    }

    transaction.status = "Success";
    transaction.providerReference = paystackData.id?.toString();
    transaction.providerResponse = {
      gateway_response: paystackData.gateway_response,
      channel: paystackData.channel,
      ip_address: paystackData.ip_address,
      authorization: paystackData.authorization
        ? {
            bank: paystackData.authorization.bank,
            channel: paystackData.authorization.channel,
            card_type: paystackData.authorization.card_type,
            last4: paystackData.authorization.last4,
          }
        : undefined,
    };
    transaction.channel = paystackData.channel;
    transaction.paidAt = new Date(paystackData.paid_at || Date.now());
    await transaction.save();

    // Confirm the order payment (triggers inventory deduction + finance record)
    await confirmOrderPayment(transaction.order);

    return { success: true, transaction };
  }

  transaction.status = "Failed";
  transaction.failureReason =
    paystackData.gateway_response || `Paystack status: ${paystackData.status}`;
  transaction.providerResponse = {
    gateway_response: paystackData.gateway_response,
    status: paystackData.status,
  };
  await transaction.save();

  return { success: false, transaction, reason: transaction.failureReason };
}

/**
 * Process a Paystack webhook event.
 */
export async function handlePaystackWebhook(event) {
  if (event.event === "charge.success") {
    const { reference } = event.data;
    if (!reference) return { handled: false, reason: "No reference" };

    const transaction = await Transaction.findOne({ reference });
    if (!transaction) return { handled: false, reason: "Unknown transaction" };

    if (transaction.status === "Success") {
      return { handled: true, reason: "Already processed" };
    }

    const result = await verifyPayment(reference);
    return { handled: true, ...result };
  }

  return { handled: false, reason: `Unhandled event: ${event.event}` };
}

/**
 * Verify Paystack webhook signature using HMAC SHA512.
 */
export function verifyWebhookSignature(body, signature) {
  if (!PAYSTACK_SECRET_KEY || !signature) return false;

  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(body)
    .digest("hex");

  return hash === signature;
}
