import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaHome, FaReceipt } from "react-icons/fa";
import { formatCurrency } from "@/utils/formatting";

export default function PaymentVerifyPage() {
  const router = useRouter();
  const { reference } = router.query;
  const { getAuthHeaders, fetchCart } = useStore();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) return;

    const verify = async () => {
      try {
        const { data } = await axios.get(
          `/api/store/payment/verify?reference=${reference}`,
          { headers: getAuthHeaders() }
        );
        setOrder(data.order);
        setStatus("success");
        // Refresh cart since it was cleared on order creation
        fetchCart();
      } catch (err) {
        setError(
          err.response?.data?.error || "Payment verification failed"
        );
        setStatus("failed");
      }
    };

    verify();
  }, [reference]);

  return (
    <StoreLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          {status === "verifying" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
              <FaSpinner className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Verifying Payment
              </h1>
              <p className="text-sm text-gray-500">
                Please wait while we confirm your payment...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FaCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Your order has been confirmed and is being processed.
              </p>
              {order && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Order Number</span>
                    <span className="font-bold text-gray-900">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(order.total, "NGN")}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/account/orders")}
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  <FaReceipt className="w-4 h-4" />
                  View My Orders
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-all"
                >
                  <FaHome className="w-4 h-4" />
                  Continue Shopping
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <FaTimesCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Failed
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {error || "We couldn't verify your payment. Please try again."}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push("/cart")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
                >
                  Return to Cart
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition-all"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
