import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaSave,
  FaReceipt,
  FaChartBar,
  FaShoppingBag,
  FaMoneyBillWave,
  FaClock,
  FaBoxOpen,
} from "react-icons/fa";

export default function AccountPage() {
  const router = useRouter();
  const { customer, isAuthenticated, getAuthHeaders, authLoading } = useStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [dashboardData, setDashboardData] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [profileRes, ordersRes] = await Promise.all([
        axios.get("/api/store/account", { headers }),
        axios.get("/api/store/orders?limit=50", { headers }).catch(() => ({ data: { orders: [] } })),
      ]);
      const profileData = profileRes.data?.customer || profileRes.data;
      setProfile(profileData);
      if (profileData) {
        const existing = JSON.parse(localStorage.getItem("storeCustomer") || "{}");
        const merged = { ...existing, ...profileData };
        localStorage.setItem("storeCustomer", JSON.stringify(merged));
      }
      
      // Build dashboard data from orders
      const orders = ordersRes.data.orders || [];
      const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
      const statusCounts = {};
      orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      setDashboardData({
        totalOrders: orders.length,
        totalSpent,
        totalItems,
        statusCounts,
        recentOrders: orders.slice(0, 5),
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/account");
      return;
    }
    if (isAuthenticated) fetchProfile();
  }, [isAuthenticated, authLoading, router, fetchProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await axios.put(
        "/api/store/account",
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          addresses: profile.addresses,
        },
        { headers: getAuthHeaders() }
      );
      const updatedProfile = data?.customer || data;
      setProfile(updatedProfile);
      if (updatedProfile) {
        const existing = JSON.parse(localStorage.getItem("storeCustomer") || "{}");
        const merged = { ...existing, ...updatedProfile };
        localStorage.setItem("storeCustomer", JSON.stringify(merged));
      }
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to update profile",
      });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "Password must be at least 8 characters",
      });
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        "/api/store/account",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { headers: getAuthHeaders() }
      );
      setMessage({ type: "success", text: "Password changed successfully." });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to change password",
      });
    }
    setSaving(false);
  };

  const addAddress = () => {
    setProfile({
      ...profile,
      addresses: [
        ...(profile.addresses || []),
        {
          label: "",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "Nigeria",
          isDefault: (profile.addresses || []).length === 0,
        },
      ],
    });
  };

  const removeAddress = (index) => {
    const updated = [...profile.addresses];
    updated.splice(index, 1);
    setProfile({ ...profile, addresses: updated });
  };

  const updateAddress = (index, field, value) => {
    const updated = [...profile.addresses];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "isDefault" && value) {
      updated.forEach((a, i) => {
        if (i !== index) a.isDefault = false;
      });
    }
    setProfile({ ...profile, addresses: updated });
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <FaChartBar className="w-4 h-4" /> },
    { id: "profile", label: "Profile", icon: <FaUser className="w-4 h-4" /> },
    {
      id: "addresses",
      label: "Addresses",
      icon: <FaMapMarkerAlt className="w-4 h-4" />,
    },
    {
      id: "password",
      label: "Password",
      icon: <FaLock className="w-4 h-4" />,
    },
  ];

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(val || 0);

  const statusColor = (s) => {
    const map = { pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700", shipped: "bg-indigo-100 text-indigo-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };
    return map[s] || "bg-gray-100 text-gray-700";
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

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <button
            onClick={() => router.push("/account/orders")}
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <FaReceipt className="w-3.5 h-3.5" />
            My Orders
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setMessage({ type: "", text: "" });
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === t.id
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && dashboardData && (
            <div className="space-y-6">
              {/* Welcome */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Welcome back, {profile?.firstName || "Customer"}</h2>
                <p className="text-sm text-gray-500 mt-0.5">Here&apos;s a summary of your account activity.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <FaShoppingBag className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <FaMoneyBillWave className="w-5 h-5 text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData.totalSpent)}</p>
                  <p className="text-xs text-gray-500">Total Spent</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <FaBoxOpen className="w-5 h-5 text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.totalItems}</p>
                  <p className="text-xs text-gray-500">Items Ordered</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <FaClock className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.statusCounts?.pending || 0}</p>
                  <p className="text-xs text-gray-500">Pending Orders</p>
                </div>
              </div>

              {/* Order Status Breakdown */}
              {dashboardData.totalOrders > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order Status Breakdown</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dashboardData.statusCounts).map(([status, count]) => (
                      <span key={status} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusColor(status)}`}>
                        {status} <span className="font-bold">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Recent Orders</h3>
                  <button onClick={() => router.push("/account/orders")} className="text-xs text-green-600 hover:text-green-700 font-medium">View All</button>
                </div>
                {dashboardData.recentOrders.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <FaShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No orders yet</p>
                    <button onClick={() => router.push("/shop")} className="mt-3 text-sm text-green-600 hover:text-green-700 font-medium">Start Shopping</button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {dashboardData.recentOrders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors" onClick={() => router.push(`/account/orders?id=${order._id}`)}>
                        <div>
                          <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColor(order.status)}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <button onClick={() => router.push("/shop")} className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FaShoppingBag className="w-4 h-4 text-green-600" /> Browse Shop
                </button>
                <button onClick={() => router.push("/account/orders")} className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FaReceipt className="w-4 h-4 text-blue-600" /> My Orders
                </button>
                <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FaUser className="w-4 h-4 text-purple-600" /> Edit Profile
                </button>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && profile && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email (cannot be changed)
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all disabled:opacity-60 text-sm"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </form>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && profile && (
            <div className="space-y-4">
              {(profile.addresses || []).map((addr, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 relative"
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={addr.label || ""}
                      onChange={(e) => updateAddress(i, "label", e.target.value)}
                      placeholder="Label (e.g. Home, Office)"
                      className="text-sm font-semibold text-gray-700 border-none focus:outline-none focus:ring-0 p-0"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addr.isDefault}
                          onChange={(e) =>
                            updateAddress(i, "isDefault", e.target.checked)
                          }
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => removeAddress(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={addr.street}
                        onChange={(e) =>
                          updateAddress(i, "street", e.target.value)
                        }
                        placeholder="Street Address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <input
                      type="text"
                      value={addr.city}
                      onChange={(e) =>
                        updateAddress(i, "city", e.target.value)
                      }
                      placeholder="City"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={addr.state}
                      onChange={(e) =>
                        updateAddress(i, "state", e.target.value)
                      }
                      placeholder="State"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={addr.postalCode || ""}
                      onChange={(e) =>
                        updateAddress(i, "postalCode", e.target.value)
                      }
                      placeholder="Postal Code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAddress}
                className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                <FaPlus className="w-3.5 h-3.5" />
                Add Address
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all disabled:opacity-60 text-sm mt-3"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                Save Addresses
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <form
              onSubmit={handleChangePassword}
              className="space-y-4 max-w-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-all disabled:opacity-60 text-sm"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaLock className="w-4 h-4" />
                )}
                Change Password
              </button>
            </form>
          )}
        </div>
      </div>
    </StoreLayout>
  );
}
