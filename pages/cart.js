import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaArrowRight, FaSpinner } from "react-icons/fa";

export default function CartPage() {
  const router = useRouter();
  const { cart, cartLoading, updateCartItem, removeCartItem, clearCart, isAuthenticated, fetchCart } = useStore();
  const [updating, setUpdating] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { if (isAuthenticated) fetchCart(); }, [isAuthenticated]);

  const handleQuantityChange = async (itemId, newQty) => {
    setUpdating(itemId);
    try { await updateCartItem(itemId, newQty); } catch (error) { alert(error.response?.data?.error || "Failed to update"); } finally { setUpdating(null); }
  };

  const handleRemove = async (itemId) => {
    setUpdating(itemId);
    try { await removeCartItem(itemId); } catch { alert("Failed to remove item"); } finally { setUpdating(null); }
  };

  const handleClearCart = async () => {
    if (!confirm("Remove all items from your cart?")) return;
    setClearing(true);
    try { await clearCart(); } catch { alert("Failed to clear cart"); } finally { setClearing(false); }
  };

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <FaShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Sign in to view your cart</h1>
          <p className="text-gray-500 mb-6">Create an account or sign in to start shopping.</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
            Sign In <FaArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </StoreLayout>
    );
  }

  if (cartLoading) {
    return (<StoreLayout><div className="flex items-center justify-center py-20"><FaSpinner className="w-8 h-8 text-green-600 animate-spin" /></div></StoreLayout>);
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <FaShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-6">Browse our products and add something you like.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
            Continue Shopping <FaArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart ({cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""})</h1>
          <button onClick={handleClearCart} disabled={clearing} className="text-sm text-red-600 hover:text-red-700 font-medium">
            {clearing ? "Clearing..." : "Clear Cart"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const product = item.product;
              const image = product?.images?.find((img) => img.isPrimary)?.url || product?.images?.[0]?.url || null;
              return (
                <div key={item._id} className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 flex gap-4">
                  <Link href={`/product/${product?.slug || ""}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {image ? <img src={image} alt={product?.name || "Product"} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${product?.slug || ""}`} className="text-sm sm:text-base font-semibold text-gray-900 hover:text-green-700 line-clamp-2">
                      {product?.name || "Product"}
                    </Link>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatCurrency(item.price, "NGN")}
                      {product?.unit && product.unit !== "Unit" && ` / ${product.unit}`}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button onClick={() => handleQuantityChange(item._id, Math.max(1, item.quantity - 1))} disabled={updating === item._id || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-40"><FaMinus className="w-2.5 h-2.5" /></button>
                        <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                          {updating === item._id ? <FaSpinner className="w-3 h-3 animate-spin" /> : item.quantity}
                        </span>
                        <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)} disabled={updating === item._id}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-40"><FaPlus className="w-2.5 h-2.5" /></button>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity, "NGN")}</span>
                      <button onClick={() => handleRemove(item._id)} disabled={updating === item._id} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <FaTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal ({cart.itemCount} items)</span><span className="font-medium">{formatCurrency(cart.subtotal, "NGN")}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600 font-medium">Free</span></div>
                <hr className="border-gray-100" />
                <div className="flex justify-between text-base font-bold text-gray-900"><span>Total</span><span>{formatCurrency(cart.subtotal, "NGN")}</span></div>
              </div>
              <button onClick={() => router.push("/checkout")} className="w-full mt-6 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-sm hover:shadow-md">
                Proceed to Checkout <FaArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link href="/" className="block text-center mt-3 text-sm text-green-600 hover:text-green-700 font-medium">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
