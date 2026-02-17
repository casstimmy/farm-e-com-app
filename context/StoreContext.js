import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const StoreContext = createContext(null);

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

export function StoreProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState({ items: [], itemCount: 0, subtotal: 0 });
  const [cartLoading, setCartLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [businessSettings, setBusinessSettings] = useState(null);
  const fetchingCart = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem("storeToken");
    const customerData = localStorage.getItem("storeCustomer");

    if (token && customerData) {
      try {
        setCustomer(JSON.parse(customerData));
      } catch {
        localStorage.removeItem("storeToken");
        localStorage.removeItem("storeCustomer");
      }
    }
    setAuthLoading(false);

    // Fetch business settings (public, no auth needed)
    axios.get("/api/store/settings")
      .then(({ data }) => setBusinessSettings(data))
      .catch(() => {});
  }, []);

  // Fetch cart when customer changes
  useEffect(() => {
    if (customer) {
      fetchCart();
    } else {
      setCart({ items: [], itemCount: 0, subtotal: 0 });
    }
  }, [customer]);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("storeToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // Auth methods
  const login = useCallback(async (email, password) => {
    const { data } = await axios.post("/api/store/auth/login", {
      email,
      password,
    });
    localStorage.setItem("storeToken", data.token);
    localStorage.setItem("storeCustomer", JSON.stringify(data.customer));
    setCustomer(data.customer);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await axios.post("/api/store/auth/register", formData);
    localStorage.setItem("storeToken", data.token);
    localStorage.setItem("storeCustomer", JSON.stringify(data.customer));
    setCustomer(data.customer);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("storeToken");
    localStorage.removeItem("storeCustomer");
    setCustomer(null);
    setCart({ items: [], itemCount: 0, subtotal: 0 });
  }, []);

  // Cart methods
  const fetchCart = useCallback(async () => {
    if (fetchingCart.current) return;
    fetchingCart.current = true;
    setCartLoading(true);

    try {
      const { data } = await axios.get("/api/store/cart", {
        headers: getAuthHeaders(),
      });
      setCart(data);
    } catch {
      // Silent fail for guest users
    } finally {
      setCartLoading(false);
      fetchingCart.current = false;
    }
  }, [getAuthHeaders]);

  const addToCart = useCallback(
    async (productId, quantity = 1, inventoryId = null, extra = null) => {
      if (!customer) {
        throw new Error("Please log in to add items to your cart");
      }

      const body = { quantity };
      if (inventoryId) {
        body.inventoryId = inventoryId;
      } else {
        body.productId = productId;
      }
      if (extra && typeof extra === "object") {
        Object.assign(body, extra);
      }

      const { data } = await axios.post(
        "/api/store/cart",
        body,
        { headers: getAuthHeaders() }
      );

      await fetchCart();
      return data;
    },
    [customer, getAuthHeaders, fetchCart]
  );

  const updateCartItem = useCallback(
    async (itemId, quantity) => {
      await axios.put(
        "/api/store/cart",
        { itemId, quantity },
        { headers: getAuthHeaders() }
      );
      await fetchCart();
    },
    [getAuthHeaders, fetchCart]
  );

  const removeCartItem = useCallback(
    async (itemId) => {
      await axios.delete("/api/store/cart", {
        headers: getAuthHeaders(),
        data: { itemId },
      });
      await fetchCart();
    },
    [getAuthHeaders, fetchCart]
  );

  const clearCart = useCallback(async () => {
    await axios.delete("/api/store/cart", {
      headers: getAuthHeaders(),
      data: { clearAll: true },
    });
    setCart({ items: [], itemCount: 0, subtotal: 0 });
  }, [getAuthHeaders]);

  const value = {
    // Auth
    customer,
    authLoading,
    isAuthenticated: !!customer,
    login,
    register,
    logout,
    getAuthHeaders,

    // Business Settings
    businessSettings,

    // Cart
    cart,
    cartLoading,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    fetchCart,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
