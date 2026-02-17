import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatting";
import {
  FaShoppingCart,
  FaDollarSign,
  FaUsers,
  FaBoxOpen,
  FaSpinner,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "year", label: "This Year" },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `/api/admin/store/dashboard?period=${period}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const statCards = data
    ? [
        {
          label: "Total Orders",
          value: data.stats?.totalOrders ?? 0,
          icon: FaShoppingCart,
          color: "blue",
          change: data.stats?.ordersChange,
        },
        {
          label: "Revenue",
          value: formatCurrency(data.stats?.revenue ?? 0),
          icon: FaDollarSign,
          color: "green",
          change: data.stats?.revenueChange,
        },
        {
          label: "Customers",
          value: data.stats?.totalCustomers ?? 0,
          icon: FaUsers,
          color: "purple",
          change: data.stats?.customersChange,
        },
        {
          label: "Products",
          value: data.stats?.totalProducts ?? 0,
          icon: FaBoxOpen,
          color: "orange",
          change: data.stats?.productsChange,
        },
      ]
    : [];

  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const revenueChartData = {
    labels: data?.revenueChart?.labels || [],
    datasets: [
      {
        label: "Revenue",
        data: data?.revenueChart?.data || [],
        borderColor: "rgb(22, 163, 74)",
        backgroundColor: "rgba(22, 163, 74, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => formatCurrency(v),
        },
      },
    },
  };

  const statusColors = {
    Pending: "#FBBF24",
    Paid: "#3B82F6",
    Processing: "#8B5CF6",
    Shipped: "#F97316",
    Delivered: "#22C55E",
    Cancelled: "#EF4444",
  };

  const statusBreakdown = data?.statusBreakdown || {};
  const statusLabels = Object.keys(statusBreakdown);
  const statusValues = Object.values(statusBreakdown);

  const doughnutData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusValues,
        backgroundColor: statusLabels.map(
          (s) => statusColors[s] || "#9CA3AF"
        ),
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { padding: 16 } },
    },
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Store Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Overview of your store performance
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition font-medium ${
                  period === p.value
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-green-600 text-3xl" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white rounded-xl shadow-sm border p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{card.label}</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">
                        {card.value}
                      </p>
                      {card.change != null && (
                        <div
                          className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                            card.change >= 0
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {card.change >= 0 ? (
                            <FaArrowUp />
                          ) : (
                            <FaArrowDown />
                          )}
                          {Math.abs(card.change)}% vs last period
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        colorMap[card.color]
                      }`}
                    >
                      <card.icon className="text-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Revenue Overview
                </h2>
                <div className="h-72">
                  <Line data={revenueChartData} options={revenueChartOptions} />
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Order Status
                </h2>
                <div className="h-72">
                  {statusLabels.length > 0 ? (
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No order data
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Top Products
                </h2>
                {data?.topProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {data.topProducts.map((product, i) => (
                      <div
                        key={product._id || i}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-6">
                            #{i + 1}
                          </span>
                          {product.image && (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {product.soldCount || 0} sold
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-800 text-sm">
                          {formatCurrency(product.revenue || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No product data
                  </p>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Orders
                </h2>
                {data?.recentOrders?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="pb-2 font-medium">Order</th>
                          <th className="pb-2 font-medium">Customer</th>
                          <th className="pb-2 font-medium">Total</th>
                          <th className="pb-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.map((order) => (
                          <tr
                            key={order._id}
                            className="border-b last:border-b-0"
                          >
                            <td className="py-2.5 font-medium text-gray-800">
                              {order.orderNumber || order._id?.slice(-6)}
                            </td>
                            <td className="py-2.5 text-gray-600">
                              {order.customerName || "N/A"}
                            </td>
                            <td className="py-2.5 text-gray-800">
                              {formatCurrency(order.total || 0)}
                            </td>
                            <td className="py-2.5">
                              <OrderBadge status={order.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No recent orders
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function OrderBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-100 text-yellow-700",
    Paid: "bg-blue-100 text-blue-700",
    Processing: "bg-purple-100 text-purple-700",
    Shipped: "bg-orange-100 text-orange-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}
