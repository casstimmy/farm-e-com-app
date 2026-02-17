import { useRouter } from "next/router";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import InventoryCard from "@/components/store/InventoryCard";
import { formatCurrency } from "@/utils/formatting";
import {
  FaChevronLeft,
  FaBox,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaTruck,
  FaShieldAlt,
  FaWarehouse,
} from "react-icons/fa";

export default function InventoryDetailPage({ item, relatedItems }) {
  const router = useRouter();

  if (!item) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <FaBox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This product may be out of stock or no longer available.
          </p>
          <button
            onClick={() => router.push("/shop")}
            className="text-amber-600 hover:text-amber-700 font-medium"
          >
            Browse Shop
          </button>
        </div>
      </StoreLayout>
    );
  }

  const isInStock = item.quantity > 0;

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push("/shop")}
            className="flex items-center gap-1 hover:text-amber-600 transition-colors"
          >
            <FaChevronLeft className="w-3 h-3" /> Shop
          </button>
          {(item.categoryName || item.category) && (
            <>
              <span>/</span>
              <span className="text-gray-400">
                {item.categoryName || item.category}
              </span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium">{item.item}</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image / Placeholder */}
            <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-12">
              <FaBox className="w-32 h-32 text-amber-200" />
            </div>

            {/* Details */}
            <div className="p-8 flex flex-col">
              {/* Category */}
              {(item.categoryName || item.category) && (
                <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                  {item.categoryName || item.category}
                </span>
              )}

              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-4">
                {item.item}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatCurrency(item.salesPrice || item.price, "NGN")}
                </span>
                {item.unit && item.unit !== "Unit" && (
                  <span className="text-sm text-gray-500">
                    per {item.unit}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {isInStock ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    In Stock ({item.quantity} {item.unit || "units"} available)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-3 mb-6">
                {item.unit && (
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">Unit</span>
                    <span className="font-medium text-gray-900">
                      {item.unit}
                    </span>
                  </div>
                )}
                {item.supplier && (
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">Supplier</span>
                    <span className="font-medium text-gray-900">
                      {item.supplier}
                    </span>
                  </div>
                )}
                {item.expiration && (
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">Best Before</span>
                    <span className="font-medium text-gray-900">
                      {new Date(item.expiration).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-3">
                <a
                  href={`https://wa.me/?text=Hi, I want to order "${item.item}" (${formatCurrency(item.salesPrice || item.price, "NGN")}${item.unit ? ` per ${item.unit}` : ""}). Is it available?`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  Order via WhatsApp
                </a>
                <a
                  href={`mailto:store@farm.com?subject=Order: ${item.item}`}
                  className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg transition-all"
                >
                  <FaEnvelope className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Quality Assured
              </p>
              <p className="text-xs text-gray-500">Farm-verified products</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <FaTruck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Delivery Available
              </p>
              <p className="text-xs text-gray-500">Fast & reliable shipping</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaWarehouse className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Fresh Stock
              </p>
              <p className="text-xs text-gray-500">
                Regularly replenished
              </p>
            </div>
          </div>
        </div>

        {/* Related Items */}
        {relatedItems?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedItems.map((r) => (
                <InventoryCard key={r._id} item={r} />
              ))}
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
    const { data } = await axios.get(
      `${baseUrl}/api/store/inventory/${params.id}`
    );
    return {
      props: { item: data.item, relatedItems: data.relatedItems || [] },
    };
  } catch {
    return { props: { item: null, relatedItems: [] } };
  }
}
