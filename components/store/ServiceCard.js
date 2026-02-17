import Link from "next/link";
import { formatCurrency } from "@/utils/formatting";
import {
  FaStethoscope,
  FaSeedling,
  FaGraduationCap,
  FaCogs,
  FaIndustry,
  FaTools,
  FaPaw,
  FaRecycle,
  FaEllipsisH,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";

/**
 * ServiceCard — Card for farm services listings.
 * Displays category icon, name, description, price, and unit.
 */
export default function ServiceCard({ service, currency = "NGN" }) {
  // Category icon and color map
  const categoryStyles = {
    "Veterinary Services": {
      icon: FaStethoscope,
      color: "bg-red-100 text-red-600",
      accent: "border-red-200",
    },
    "Breeding Services": {
      icon: FaPaw,
      color: "bg-pink-100 text-pink-600",
      accent: "border-pink-200",
    },
    "Feed & Nutrition": {
      icon: FaSeedling,
      color: "bg-green-100 text-green-600",
      accent: "border-green-200",
    },
    "Training & Consultation": {
      icon: FaGraduationCap,
      color: "bg-blue-100 text-blue-600",
      accent: "border-blue-200",
    },
    "Processing & Value Addition": {
      icon: FaIndustry,
      color: "bg-purple-100 text-purple-600",
      accent: "border-purple-200",
    },
    "Equipment & Facilities": {
      icon: FaTools,
      color: "bg-amber-100 text-amber-600",
      accent: "border-amber-200",
    },
    "Animal Sales": {
      icon: FaPaw,
      color: "bg-emerald-100 text-emerald-600",
      accent: "border-emerald-200",
    },
    "Waste Management": {
      icon: FaRecycle,
      color: "bg-teal-100 text-teal-600",
      accent: "border-teal-200",
    },
    Other: {
      icon: FaEllipsisH,
      color: "bg-gray-100 text-gray-600",
      accent: "border-gray-200",
    },
  };

  const style = categoryStyles[service.category] || categoryStyles.Other;
  const Icon = style.icon;

  return (
    <div
      className={`group bg-white rounded-xl border ${style.accent} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col`}
    >
      {/* Category Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-11 h-11 rounded-xl ${style.color} flex items-center justify-center`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {service.unit && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <FaClock className="w-3 h-3" />
              <span>{service.unit}</span>
            </div>
          )}
        </div>

        {/* Category Label */}
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          {service.category}
        </span>

        {/* Service Name */}
        <Link href={`/services/${service._id}`}>
          <h3 className="text-base font-semibold text-gray-900 mt-1 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
            {service.name}
          </h3>
        </Link>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-4">
            {service.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 pb-5">
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {service.price > 0
                ? formatCurrency(service.price, currency)
                : "Contact us"}
            </span>
            {service.unit && service.price > 0 && (
              <span className="text-xs text-gray-400 ml-1">
                / {service.unit}
              </span>
            )}
          </div>
          <Link
            href={`/services/${service._id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            Details
            <FaArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
