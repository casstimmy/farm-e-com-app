import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import {
  FaCheckCircle,
  FaReceipt,
  FaShoppingCart,
  FaSpinner,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBoxOpen,
  FaTruck,
} from "react-icons/fa";

const statusClassMap = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Processing: "bg-blue-100 text-blue-700 border-blue-200",
  Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Delivered: "bg-green-100 text-green-700 border-green-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  Refunded: "bg-gray-100 text-gray-700 border-gray-200",
};

const paymentClassMap = {
  Unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Refunded: "bg-gray-50 text-gray-700 border-gray-200",
  "Partially Refunded": "bg-blue-50 text-blue-700 border-blue-200",
};

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { isAuthenticated, getAuthHeaders, fetchCart } = useStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const orderNumber = useMemo(() => {
    const raw = router.query?.order;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!orderNumber) {
      setError("Order number is missing.");
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/order-confirmation?order=${orderNumber}`)}`);
      return;
    }

    const loadOrder = async () => {
      setLoading(true);
      setError("");
      try {
        await fetchCart();
        const { data } = await axios.get(
          `/api/store/orders?order=${encodeURIComponent(orderNumber)}`,
          { headers: getAuthHeaders() }
        );
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [router.isReady, orderNumber, isAuthenticated, getAuthHeaders, fetchCart, router]);

  const statusStyle = statusClassMap[order?.status] || "bg-gray-100 text-gray-700 border-gray-200";
  const paymentStyle = paymentClassMap[order?.paymentStatus] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
              <FaSpinner className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Loading order confirmation...</p>
            </div>
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto text-center bg-white border border-red-100 rounded-2xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Order</h1>
            <p className="text-sm text-red-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                <FaReceipt className="w-4 h-4" />
                View My Orders
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                <FaShoppingCart className="w-4 h-4" />
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-green-700 to-teal-700 p-8 text-white shadow-lg mb-8">
              <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-20 -left-14 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4">
                  <FaCheckCircle className="w-8 h-8 text-emerald-200" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
                  Order Confirmed
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base mb-6">
                  Thank you. Your order has been received and is now in our fulfillment queue.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/10 border border-white/15 rounded-xl p-3">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-100">Order Number</p>
                    <p className="font-bold">{order?.orderNumber || orderNumber}</p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-xl p-3">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-100">Order Date</p>
                    <p className="font-semibold">
                      {order?.createdAt
                        ? new Date(order.createdAt).toLocaleString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-xl p-3">
                    <p className="text-[11px] uppercase tracking-wider text-emerald-100">Total</p>
                    <p className="font-bold">
                      {formatCurrency(order?.total || 0, "NGN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Items Ordered</h2>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyle}`}>
                      Status: {order?.status || "Pending"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(order?.items || []).map((item) => (
                      <div key={item._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                        <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <FaBoxOpen className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty {item.quantity} x {formatCurrency(item.price || 0, "NGN")}
                          </p>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.lineTotal || 0, "NGN")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Details</h2>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                      <FaMapMarkerAlt className="w-4 h-4" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 mb-0.5">
                        {order?.customerName || "Customer"}
                      </p>
                      <p>{order?.shippingAddress?.street || "-"}</p>
                      <p>
                        {order?.shippingAddress?.city || "-"}, {order?.shippingAddress?.state || "-"}
                      </p>
                      <p>
                        {order?.shippingAddress?.postalCode || ""} {order?.shippingAddress?.country || "Nigeria"}
                      </p>
                      {order?.customerPhone && (
                        <p className="mt-1 text-gray-500">{order.customerPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order?.subtotal || 0, "NGN")}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{formatCurrency(order?.shippingCost || 0, "NGN")}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatCurrency(order?.tax || 0, "NGN")}</span>
                    </div>
                    {order?.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount, "NGN")}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
                      <span>Total</span>
                      <span>{formatCurrency(order?.total || 0, "NGN")}</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <FaCreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium text-gray-900">{order?.paymentMethod || "-"}</span>
                    </div>
                    <div className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${paymentStyle}`}>
                      Payment: {order?.paymentStatus || "Unpaid"}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">What Happens Next</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                      <p className="text-gray-600">Your order is reviewed and confirmed by our team.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                      <p className="text-gray-600">We prepare your items and schedule dispatch.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                      <p className="text-gray-600">You receive delivery updates until completion.</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500">
                    <FaTruck className="inline mr-1.5" />
                    Track updates anytime in your account orders section.
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Link
                    href="/account/orders"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    <FaReceipt className="w-4 h-4" />
                    View My Orders
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-all"
                  >
                    <FaShoppingCart className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </StoreLayout>
  );
}
