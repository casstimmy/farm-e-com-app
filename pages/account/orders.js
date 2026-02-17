import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import {
  FaSpinner,
  FaReceipt,
  FaChevronLeft,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaCreditCard,
  FaUser,
} from "react-icons/fa";

const STATUS_CONFIG = {
  Pending: { color: "bg-yellow-100 text-yellow-700", icon: FaClock },
  Paid: { color: "bg-blue-100 text-blue-700", icon: FaCreditCard },
  Processing: { color: "bg-indigo-100 text-indigo-700", icon: FaBox },
  Shipped: { color: "bg-purple-100 text-purple-700", icon: FaTruck },
  Delivered: { color: "bg-green-100 text-green-700", icon: FaCheckCircle },
  Cancelled: { color: "bg-red-100 text-red-700", icon: FaTimesCircle },
  Refunded: { color: "bg-gray-100 text-gray-600", icon: FaTimesCircle },
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, getAuthHeaders, authLoading } = useStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/account/orders");
      return;
    }
    if (isAuthenticated) fetchOrders();
  }, [isAuthenticated, authLoading]);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/store/orders", {
        headers: getAuthHeaders(),
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (orderId) => {
    setDetailLoading(true);
    try {
      const { data } = await axios.get(`/api/store/orders?id=${orderId}`, {
        headers: getAuthHeaders(),
      });
      setSelectedOrder(data.order);
    } catch (err) {
      console.error("Failed to fetch order detail", err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <FaSpinner className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </StoreLayout>
    );
  }

  // Order detail view
  if (selectedOrder) {
    const statusConf = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.Pending;
    const StatusIcon = statusConf.icon;

    return (
      <StoreLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6"
          >
            <FaChevronLeft className="w-3 h-3" />
            Back to Orders
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order {selectedOrder.orderNumber}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed on{" "}
                {new Date(selectedOrder.createdAt).toLocaleDateString("en", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConf.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {selectedOrder.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Items */}
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Items
              </h2>
              <div className="space-y-3">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(item.price, "NGN")} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(item.lineTotal, "NGN")}
                    </span>
                  </div>
                ))}
              </div>

              <hr className="my-4 border-gray-100" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal, "NGN")}</span>
                </div>
                {selectedOrder.shippingCost > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>
                      {formatCurrency(selectedOrder.shippingCost, "NGN")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total, "NGN")}</span>
                </div>
              </div>
            </div>

            {/* Sidebar info */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Shipping Address
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedOrder.shippingAddress?.street}
                  <br />
                  {selectedOrder.shippingAddress?.city},{" "}
                  {selectedOrder.shippingAddress?.state}
                  <br />
                  {selectedOrder.shippingAddress?.postalCode &&
                    `${selectedOrder.shippingAddress.postalCode}, `}
                  {selectedOrder.shippingAddress?.country || "Nigeria"}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Payment
                </h3>
                <p className="text-sm text-gray-700">
                  {selectedOrder.paymentMethod}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Status:{" "}
                  <span
                    className={
                      selectedOrder.paymentStatus === "Paid"
                        ? "text-green-600 font-medium"
                        : "text-yellow-600 font-medium"
                    }
                  >
                    {selectedOrder.paymentStatus}
                  </span>
                </p>
              </div>

              {selectedOrder.statusHistory?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Timeline
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <div className="w-2 h-2 mt-1 rounded-full bg-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-gray-700 font-medium">
                            {h.status}
                          </p>
                          <p className="text-gray-400">
                            {new Date(h.timestamp).toLocaleString()}
                          </p>
                          {h.note && (
                            <p className="text-gray-500 mt-0.5">{h.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // Orders list
  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <button
            onClick={() => router.push("/account")}
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <FaUser className="w-3.5 h-3.5" />
            My Account
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <FaReceipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-700 mb-2">
              No orders yet
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Start shopping to see your orders here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
              const Icon = sc.icon;
              return (
                <button
                  key={order._id}
                  onClick={() => viewOrder(order._id)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      &middot; {order.items?.length || 0} item
                      {order.items?.length !== 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold text-gray-700">
                      {formatCurrency(order.total, "NGN")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {detailLoading && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <FaSpinner className="w-6 h-6 animate-spin text-green-600 mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Loading order...</p>
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
