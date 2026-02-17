import Link from "next/link";
import { formatCurrency } from "@/utils/formatting";
import { FaShoppingCart, FaStar } from "react-icons/fa";

export default function ProductCard({ product, currency = "NGN", onAddToCart }) {
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    null;

  const isInStock = !product.trackInventory || product.stockQuantity > 0;
  const isLowStock =
    product.trackInventory &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= (product.lowStockThreshold || 5);

  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100
        )
      : 0;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaStar className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
        </div>

        {!isInStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-semibold px-4 py-2 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Category */}
        {product.storeCategory && (
          <span className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">
            {product.storeCategory.name || product.storeCategory}
          </span>
        )}

        {/* Name */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Short description */}
        {product.shortDescription && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.price, currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.compareAtPrice, currency)}
              </span>
            )}
            {product.unit && product.unit !== "Unit" && (
              <span className="text-xs text-gray-400">/ {product.unit}</span>
            )}
          </div>

          {/* Stock indicator */}
          {isLowStock && (
            <p className="text-xs text-orange-600 font-medium mb-2">
              Only {product.stockQuantity} left
            </p>
          )}

          {/* Add to cart button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              if (isInStock && onAddToCart) {
                onAddToCart(product._id);
              }
            }}
            disabled={!isInStock}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isInStock
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaShoppingCart className="w-3.5 h-3.5" />
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
