import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import StoreLayout from "@/components/store/StoreLayout";
import { FaCheckCircle, FaReceipt, FaShoppingCart } from "react-icons/fa";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const orderNumber = useMemo(() => {
    const raw = router.query?.order;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query]);

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FaCheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Order Confirmed
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Your order has been placed successfully.
        </p>

        {orderNumber && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Order Number
            </p>
            <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            <FaReceipt className="w-4 h-4" />
            View Orders
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-all"
          >
            <FaShoppingCart className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </StoreLayout>
  );
}

