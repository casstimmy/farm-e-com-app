import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import {
  FaLock,
  FaCreditCard,
  FaUniversity,
  FaTruck,
  FaSpinner,
  FaChevronLeft,
} from "react-icons/fa";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isAuthenticated, getAuthHeaders, customer, fetchCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Paystack");

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Nigeria",
  });
  const [notes, setNotes] = useState("");

  const applyDefaultAddress = useCallback((profile) => {
    if (!profile) return false;
    const defaultAddr = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0];
    if (!defaultAddr) return false;

    setShippingAddress({
      street: defaultAddr.street || "",
      city: defaultAddr.city || "",
      state: defaultAddr.state || "",
      postalCode: defaultAddr.postalCode || "",
      country: defaultAddr.country || "Nigeria",
    });
    return true;
  }, []);

  // Load saved address from local profile, then refresh from account API.
  useEffect(() => {
    if (!customer || !isAuthenticated) return;

    const t = setTimeout(() => {
      const hydrated = applyDefaultAddress(customer);
      if (hydrated) return;

      axios
        .get("/api/store/account", { headers: getAuthHeaders() })
        .then(({ data }) => {
          const profile = data?.customer || data;
          if (!profile) return;
          applyDefaultAddress(profile);
          const existing = JSON.parse(localStorage.getItem("storeCustomer") || "{}");
          localStorage.setItem("storeCustomer", JSON.stringify({ ...existing, ...profile }));
        })
        .catch(() => {});
    }, 0);

    return () => clearTimeout(t);
  }, [customer, isAuthenticated, getAuthHeaders, applyDefaultAddress]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/checkout");
    }
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  if (!isAuthenticated || !cart.items || cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Your cart is empty
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </StoreLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state) {
      setError("Please fill in all required shipping address fields.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        "/api/store/checkout",
        {
          shippingAddress,
          paymentMethod,
          notes,
        },
        { headers: getAuthHeaders() }
      );

      if (paymentMethod === "Paystack" && data.payment?.authorizationUrl) {
        await fetchCart();
        // Redirect to Paystack checkout
        window.location.href = data.payment.authorizationUrl;
      } else {
        await fetchCart();
        // Order placed — redirect to confirmation
        router.push(
          `/order-confirmation?order=${data.order.orderNumber}`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "Paystack",
      label: "Pay with Card (Paystack)",
      icon: <FaCreditCard className="w-4 h-4" />,
      description: "Secure card payment via Paystack",
    },
    {
      id: "Bank Transfer",
      label: "Bank Transfer",
      icon: <FaUniversity className="w-4 h-4" />,
      description: "Transfer to our bank account",
    },
    {
      id: "Cash on Delivery",
      label: "Cash on Delivery",
      icon: <FaTruck className="w-4 h-4" />,
      description: "Pay when you receive your order",
    },
  ];

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 mb-6"
        >
          <FaChevronLeft className="w-3 h-3" />
          Back to Cart
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Shipping + Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping address */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="Lagos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="Lagos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="100001"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "border-green-600 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === method.id
                            ? "border-green-600"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        {method.icon}
                        <div>
                          <span className="text-sm font-semibold block">
                            {method.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {method.description}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Notes (Optional)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                  placeholder="Special delivery instructions or notes..."
                />
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  {cart.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.product?.images?.[0]?.url ? (
                          <img
                            src={item.product.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium truncate">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(item.price * item.quantity, "NGN")}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="border-gray-100 my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cart.subtotal, "NGN")}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(cart.subtotal, "NGN")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 px-6 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-60"
                >
                  {loading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaLock className="w-3.5 h-3.5" />
                  )}
                  {loading
                    ? "Processing..."
                    : paymentMethod === "Paystack"
                      ? `Pay ${formatCurrency(cart.subtotal, "NGN")}`
                      : "Place Order"}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  <FaLock className="inline w-3 h-3 mr-1" />
                  Your payment information is secure
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}
