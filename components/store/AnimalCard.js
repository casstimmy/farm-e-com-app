import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/utils/formatting";
import { FaWeight, FaVenusMars, FaPaw, FaMapMarkerAlt, FaShoppingCart, FaSpinner } from "react-icons/fa";

/**
 * AnimalCard — Rich product card for livestock listings.
 * Displays image, species badge, breed, gender, weight, price, location.
 */
export default function AnimalCard({ animal, currency = "NGN", onAddToCart = null }) {
  const [adding, setAdding] = useState(false);
  const primaryImage =
    animal.images?.[0]?.thumb || animal.images?.[0]?.full || null;

  // Calculate age from dob
  let ageDisplay = null;
  if (animal.dob) {
    const now = new Date();
    const birth = new Date(animal.dob);
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const rem = months % 12;
      ageDisplay = `${years}yr${years > 1 ? "s" : ""}${rem > 0 ? ` ${rem}mo` : ""}`;
    } else {
      ageDisplay = `${months}mo`;
    }
  }

  // Species color map
  const speciesColors = {
    goat: "bg-amber-100 text-amber-800",
    sheep: "bg-blue-100 text-blue-800",
    cattle: "bg-emerald-100 text-emerald-800",
    cow: "bg-emerald-100 text-emerald-800",
    chicken: "bg-orange-100 text-orange-800",
    poultry: "bg-orange-100 text-orange-800",
    pig: "bg-pink-100 text-pink-800",
    rabbit: "bg-purple-100 text-purple-800",
    fish: "bg-cyan-100 text-cyan-800",
    turkey: "bg-red-100 text-red-800",
    duck: "bg-teal-100 text-teal-800",
  };

  const speciesColor =
    speciesColors[animal.species?.toLowerCase()] || "bg-gray-100 text-gray-800";

  const genderIcon = animal.gender === "Male" ? "♂" : "♀";
  const genderColor =
    animal.gender === "Male"
      ? "text-blue-600 bg-blue-50"
      : "text-pink-600 bg-pink-50";

  const handleAddClick = async () => {
    if (!onAddToCart || adding) return;
    setAdding(true);
    try {
      await onAddToCart(animal);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image Section */}
      <Link href={`/animals/${animal._id}`} className="block relative">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={animal.name || animal.tagId}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
              <FaPaw className="w-12 h-12 text-green-300" />
            </div>
          )}
        </div>

        {/* Species Badge */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${speciesColor} backdrop-blur-sm`}
          >
            {animal.species}
          </span>
        </div>

        {/* Gender Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${genderColor}`}
          >
            {genderIcon}
          </span>
        </div>

        {/* Tag ID */}
        <div className="absolute bottom-2 left-2">
          <span className="text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
            #{animal.tagId}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Breed */}
        {animal.breed && (
          <span className="text-xs text-green-600 font-medium uppercase tracking-wide mb-0.5">
            {animal.breed}
          </span>
        )}

        {/* Name */}
        <Link href={`/animals/${animal._id}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors mb-2">
            {animal.name || `${animal.species} — ${animal.tagId}`}
          </h3>
        </Link>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-xs text-gray-500">
          {animal.currentWeight > 0 && (
            <div className="flex items-center gap-1.5">
              <FaWeight className="w-3 h-3 text-gray-400" />
              <span>{animal.currentWeight} kg</span>
            </div>
          )}
          {ageDisplay && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px]">🕐</span>
              <span>{ageDisplay}</span>
            </div>
          )}
          {animal.color && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[10px]">🎨</span>
              <span className="capitalize">{animal.color}</span>
            </div>
          )}
          {animal.location?.name && (
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
              <span className="truncate">{animal.location.name}</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(animal.projectedSalesPrice, currency)}
            </span>
          </div>

          {/* Action Buttons */}
          {onAddToCart ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleAddClick}
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60"
              >
                {adding ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaShoppingCart className="w-4 h-4" />}
                {adding ? "Adding..." : "Add to Cart"}
              </button>
              <Link
                href={`/animals/${animal._id}`}
                className="w-full flex items-center justify-center py-2 rounded-lg text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
              >
                View Details
              </Link>
            </div>
          ) : (
            <Link
              href={`/animals/${animal._id}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
