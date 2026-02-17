import Link from "next/link";
import { formatCurrency } from "@/utils/formatting";
import { FaBox, FaShoppingCart } from "react-icons/fa";

/**
 * InventoryCard — Product card for inventory items sold on the store.
 * Displays item name, category, price, stock, and unit.
 */
export default function InventoryCard({ item, currency = "NGN", onAddToCart }) {
  const isInStock = item.quantity > 0;
  const isLowStock = item.quantity > 0 && item.quantity <= (item.minStock || 5);

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image / Placeholder */}
      <Link href={`/shop/${item._id}`} className="block relative">
        <div className="aspect-square bg-gradient-to-br from-green-50 to-emerald-100 overflow-hidden flex items-center justify-center">
          <FaBox className="w-14 h-14 text-green-200 group-hover:scale-110 transition-transform duration-300" />
        </div>

        {/* Category Badge */}
        {item.categoryName && (
          <div className="absolute top-2 left-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 backdrop-blur-sm">
              {item.categoryName}
            </span>
          </div>
        )}

        {/* Stock Badge */}
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
        {item.category && (
          <span className="text-xs text-green-600 font-medium uppercase tracking-wide mb-0.5">
            {item.category}
          </span>
        )}

        {/* Item Name */}
        <Link href={`/shop/${item._id}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors mb-2">
            {item.item}
          </h3>
        </Link>

        {/* Unit info */}
        {item.unit && item.unit !== "Unit" && (
          <p className="text-xs text-gray-400 mb-2">
            Sold per {item.unit}
          </p>
        )}

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(item.salesPrice || item.price, currency)}
            </span>
            {item.unit && item.unit !== "Unit" && (
              <span className="text-xs text-gray-400">/ {item.unit}</span>
            )}
          </div>

          {/* Stock indicator */}
          {isLowStock && (
            <p className="text-xs text-orange-600 font-medium mb-2">
              Only {item.quantity} left
            </p>
          )}

          {/* View / Add to Cart */}
          <Link
            href={`/shop/${item._id}`}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isInStock
                ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FaShoppingCart className="w-3.5 h-3.5" />
            {isInStock ? "View Product" : "Out of Stock"}
          </Link>
        </div>
      </div>
    </div>
  );
}
