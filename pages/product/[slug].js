import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import ProductCard from "@/components/store/ProductCard";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import {
  FaShoppingCart, FaMinus, FaPlus, FaChevronLeft,
  FaStar, FaTruck, FaShieldAlt, FaSpinner,
} from "react-icons/fa";

export default function ProductDetailPage({ product, relatedProducts }) {
  const router = useRouter();
  const { addToCart, isAuthenticated } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [notification, setNotification] = useState("");

  if (!product) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Product Not Found</h1>
          <button onClick={() => router.push("/")} className="text-green-600 hover:text-green-700 font-medium">
            Back to Store
          </button>
        </div>
      </StoreLayout>
    );
  }

  const isInStock = !product.trackInventory || product.stockQuantity > 0;
  const maxQty = product.trackInventory ? product.stockQuantity : 99;

  const handleAddToCart = async () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      setNotification("Added to cart!");
      setTimeout(() => setNotification(""), 2000);
    } catch (error) {
      setNotification(error.response?.data?.error || "Failed to add to cart");
      setTimeout(() => setNotification(""), 3000);
    } finally { setAdding(false); }
  };

  const images = product.images?.length > 0 ? product.images : [{ url: null, alt: product.name }];

  return (
    <StoreLayout>
      {notification && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
          {notification}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => router.push("/")} className="flex items-center gap-1 hover:text-green-600 transition-colors">
            <FaChevronLeft className="w-3 h-3" /> Products
          </button>
          {product.storeCategory && (<><span>/</span><span className="text-gray-400">{product.storeCategory.name}</span></>)}
          <span>/</span>
          <span className="text-gray-700 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
              {images[selectedImage]?.url ? (
                <img src={images[selectedImage].url} alt={images[selectedImage].alt || product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === i ? "border-green-600" : "border-gray-200 hover:border-gray-300"}`}>
                    <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.storeCategory && (
              <span className="text-sm text-green-600 font-medium uppercase tracking-wide">{product.storeCategory.name}</span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-4">{product.name}</h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price, "NGN")}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatCurrency(product.compareAtPrice, "NGN")}</span>
              )}
              {product.unit && product.unit !== "Unit" && (
                <span className="text-sm text-gray-500">per {product.unit}</span>
              )}
            </div>

            <div className="mb-6">
              {isInStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full" /> In Stock
                  {product.trackInventory && <span className="text-green-500">({product.stockQuantity} available)</span>}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full" /> Out of Stock
                </span>
              )}
            </div>

            {product.description && (
              <div className="prose prose-sm text-gray-600 mb-6 max-w-none">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {isInStock && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors">
                    <FaMinus className="w-3 h-3" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold text-gray-800 border-x border-gray-300">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors">
                    <FaPlus className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={handleAddToCart} disabled={adding}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-60">
                  {adding ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaShoppingCart className="w-4 h-4" />}
                  {adding ? "Adding..." : `Add to Cart — ${formatCurrency(product.price * quantity, "NGN")}`}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FaTruck className="w-4 h-4 text-green-600" /><span>Delivery available</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <FaShieldAlt className="w-4 h-4 text-green-600" /><span>Quality guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

export async function getServerSideProps({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  try {
    const { data } = await axios.get(`${baseUrl}/api/store/products/${params.slug}`);
    return { props: { product: data.product, relatedProducts: data.relatedProducts || [] } };
  } catch {
    return { props: { product: null, relatedProducts: [] } };
  }
}
