import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { formatCurrency, formatDate } from "@/utils/formatting";
import {
  FaSearch,
  FaSpinner,
  FaSortAmountDown,
  FaUser,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "name", label: "Name (A-Z)" },
  { value: "spent", label: "Most Spent" },
  { value: "orders", label: "Most Orders" },
];

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: "Bearer " + token };
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/store/customers", {
        headers: getHeaders(),
        params: { search, sort: sortBy },
      });
      setCustomers(res.data.customers || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <AdminLayout title="Customers">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-500 text-sm">
            View your store customers
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaSortAmountDown className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
          ) : customers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No customers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Customer
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Phone
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      Orders
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      Total Spent
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Joined
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer._id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <FaUser className="text-green-600 text-sm" />
                          </div>
                          <span className="font-medium text-gray-800">
                            {customer.name ||
                              `${customer.firstName || ""} ${
                                customer.lastName || ""
                              }`.trim() ||
                              "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FaEnvelope className="text-gray-400 text-xs" />
                          {customer.email || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <FaPhone className="text-gray-400 text-xs" />
                          {customer.phone || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {customer.orderCount ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatCurrency(customer.totalSpent ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(
                          customer.createdAt || customer.joinDate
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.isActive !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {customer.isActive !== false
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && customers.length > 0 && (
          <div className="text-sm text-gray-500 text-right">
            Showing {customers.length} customer
            {customers.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
