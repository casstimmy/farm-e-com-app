import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatting";
import {
  FaSearch,
  FaSpinner,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaMapMarkerAlt,
  FaStickyNote,
} from "react-icons/fa";

const STATUS_OPTIONS = [
  "Pending",
  "Paid",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_TRANSITIONS = {
  Pending: ["Paid", "Cancelled"],
  Paid: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const STATUS_STYLES = {
  Pending: "bg-yellow-100 text-yellow-700",
  Paid: "bg-blue-100 text-blue-700",
  Processing: "bg-purple-100 text-purple-700",
  Shipped: "bg-orange-100 text-orange-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const PAYMENT_STYLES = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: "Bearer " + token };
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await axios.get("/api/admin/store/orders", {
        headers: getHeaders(),
        params,
      });
      setOrders(res.data.orders || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const payload = { status: newStatus };
      if (adminNote.trim()) payload.adminNote = adminNote.trim();

      await axios.put(`/api/admin/store/orders/${orderId}`, payload, {
        headers: getHeaders(),
      });

      // Refresh selected order detail
      const res = await axios.get(`/api/admin/store/orders/${orderId}`, {
        headers: getHeaders(),
      });
      setSelectedOrder(res.data.order || res.data);
      setAdminNote("");
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openOrderDetail = async (order) => {
    try {
      const res = await axios.get(`/api/admin/store/orders/${order._id}`, {
        headers: getHeaders(),
      });
      setSelectedOrder(res.data.order || res.data);
    } catch {
      setSelectedOrder(order);
    }
  };

  const availableTransitions =
    selectedOrder && STATUS_TRANSITIONS[selectedOrder.status]
      ? STATUS_TRANSITIONS[selectedOrder.status]
      : [];

  return (
    <AdminLayout title="Orders">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 text-sm">
            Manage and track customer orders
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="To"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-green-600 text-2xl" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Order #
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Total
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Payment
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => openOrderDetail(order)}
                      className="border-b last:border-b-0 hover:bg-green-50 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-medium text-green-700">
                        {order.orderNumber || order._id?.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.customerName ||
                          order.customer?.name ||
                          order.shippingAddress?.name ||
                          "N/A"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {formatCurrency(order.total || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_STYLES[order.status] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            PAYMENT_STYLES[order.paymentStatus] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.paymentStatus || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Order{" "}
                  {selectedOrder.orderNumber ||
                    selectedOrder._id?.slice(-8).toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status & Update */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <span className="text-sm text-gray-500">Current Status</span>
                  <div className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        STATUS_STYLES[selectedOrder.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
                {availableTransitions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Update to:</span>
                    {availableTransitions.map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleStatusUpdate(selectedOrder._id, status)
                        }
                        disabled={updatingStatus}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                          status === "Cancelled"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        } disabled:opacity-50`}
                      >
                        {updatingStatus ? "..." : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Note */}
              {availableTransitions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaStickyNote className="inline mr-1" /> Admin Note
                    (optional)
                  </label>
                  <input
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note with the status update..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Product
                        </th>
                        <th className="text-center px-4 py-2 font-medium text-gray-600">
                          Qty
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">
                          Price
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-gray-600">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="px-4 py-2.5 text-gray-800">
                            {item.name || item.product?.name || "Product"}
                          </td>
                          <td className="px-4 py-2.5 text-center text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-600">
                            {formatCurrency(item.price || 0)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                            {formatCurrency(
                              (item.price || 0) * (item.quantity || 1)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      {selectedOrder.subtotal != null && (
                        <tr className="border-t">
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-gray-600"
                          >
                            Subtotal
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(selectedOrder.subtotal)}
                          </td>
                        </tr>
                      )}
                      {selectedOrder.shippingCost > 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-gray-600"
                          >
                            Shipping
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            {formatCurrency(selectedOrder.shippingCost)}
                          </td>
                        </tr>
                      )}
                      {selectedOrder.discount > 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-gray-600"
                          >
                            Discount
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-red-600">
                            -{formatCurrency(selectedOrder.discount)}
                          </td>
                        </tr>
                      )}
                      <tr className="border-t">
                        <td
                          colSpan={3}
                          className="px-4 py-2.5 text-right font-semibold text-gray-800"
                        >
                          Total
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-800 text-base">
                          {formatCurrency(selectedOrder.total || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    <FaMapMarkerAlt className="inline mr-1 text-green-600" />
                    Shipping Address
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <p className="font-medium">
                      {selectedOrder.shippingAddress.name}
                    </p>
                    <p>{selectedOrder.shippingAddress.address}</p>
                    {selectedOrder.shippingAddress.city && (
                      <p>
                        {selectedOrder.shippingAddress.city}
                        {selectedOrder.shippingAddress.state &&
                          `, ${selectedOrder.shippingAddress.state}`}
                        {selectedOrder.shippingAddress.zip &&
                          ` ${selectedOrder.shippingAddress.zip}`}
                      </p>
                    )}
                    {selectedOrder.shippingAddress.phone && (
                      <p className="mt-1">
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              {selectedOrder.paymentMethod && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Payment Info
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    <p>
                      <span className="text-gray-500">Method:</span>{" "}
                      {selectedOrder.paymentMethod}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          PAYMENT_STYLES[selectedOrder.paymentStatus] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                    {selectedOrder.paymentReference && (
                      <p>
                        <span className="text-gray-500">Reference:</span>{" "}
                        {selectedOrder.paymentReference}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {selectedOrder.statusHistory?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Status History
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.statusHistory.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">
                            {entry.status || entry.action}
                          </span>
                          {entry.note && (
                            <span className="text-gray-500">
                              {" "}
                              — {entry.note}
                            </span>
                          )}
                          <p className="text-xs text-gray-400">
                            {formatDate(entry.timestamp || entry.date)}
                            {entry.by && ` by ${entry.by}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedOrder.adminNotes?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Admin Notes
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.adminNotes.map((note, i) => (
                      <div
                        key={i}
                        className="p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-sm"
                      >
                        <p className="text-gray-700">{note.text || note}</p>
                        {note.date && (
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(note.date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
