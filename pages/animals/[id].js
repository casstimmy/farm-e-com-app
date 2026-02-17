import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import AnimalCard from "@/components/store/AnimalCard";
import { formatCurrency } from "@/utils/formatting";
import {
  FaChevronLeft,
  FaPaw,
  FaWeight,
  FaVenusMars,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPalette,
  FaTag,
  FaDna,
  FaRulerVertical,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaShieldAlt,
  FaTruck,
  FaCheckCircle,
} from "react-icons/fa";

export default function AnimalDetailPage({ animal, relatedAnimals }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);

  if (!animal) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <FaPaw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Animal Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This animal may have been sold or is no longer available.
          </p>
          <button
            onClick={() => router.push("/animals")}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Browse Animals
          </button>
        </div>
      </StoreLayout>
    );
  }

  const images =
    animal.images?.length > 0
      ? animal.images
      : [{ full: null, thumb: null }];

  // Calculate age
  let ageDisplay = "";
  let ageMonths = 0;
  if (animal.dob) {
    const now = new Date();
    const birth = new Date(animal.dob);
    ageMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());
    if (ageMonths >= 12) {
      const years = Math.floor(ageMonths / 12);
      const rem = ageMonths % 12;
      ageDisplay = `${years} year${years > 1 ? "s" : ""}${rem > 0 ? ` ${rem} month${rem > 1 ? "s" : ""}` : ""}`;
    } else {
      ageDisplay = `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;
    }
  }

  // Species color
  const speciesColors = {
    goat: "bg-amber-100 text-amber-800 border-amber-200",
    sheep: "bg-blue-100 text-blue-800 border-blue-200",
    cattle: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cow: "bg-emerald-100 text-emerald-800 border-emerald-200",
    chicken: "bg-orange-100 text-orange-800 border-orange-200",
    poultry: "bg-orange-100 text-orange-800 border-orange-200",
    pig: "bg-pink-100 text-pink-800 border-pink-200",
    rabbit: "bg-purple-100 text-purple-800 border-purple-200",
    fish: "bg-cyan-100 text-cyan-800 border-cyan-200",
    turkey: "bg-red-100 text-red-800 border-red-200",
    duck: "bg-teal-100 text-teal-800 border-teal-200",
  };

  const speciesStyle =
    speciesColors[animal.species?.toLowerCase()] ||
    "bg-gray-100 text-gray-800 border-gray-200";

  const detailItems = [
    { icon: FaTag, label: "Tag ID", value: animal.tagId },
    { icon: FaDna, label: "Breed", value: animal.breed },
    {
      icon: FaVenusMars,
      label: "Gender",
      value: animal.gender,
    },
    { icon: FaCalendarAlt, label: "Age", value: ageDisplay || "N/A" },
    {
      icon: FaCalendarAlt,
      label: "Date of Birth",
      value: animal.dob
        ? new Date(animal.dob).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
    },
    { icon: FaPalette, label: "Color", value: animal.color },
    {
      icon: FaWeight,
      label: "Current Weight",
      value: animal.currentWeight ? `${animal.currentWeight} kg` : null,
    },
    {
      icon: FaRulerVertical,
      label: "Projected Max Weight",
      value: animal.projectedMaxWeight
        ? `${animal.projectedMaxWeight} kg`
        : null,
    },
    { icon: FaPaw, label: "Class", value: animal.class },
    { icon: FaPaw, label: "Origin", value: animal.origin },
    {
      icon: FaMapMarkerAlt,
      label: "Location",
      value: animal.location?.name
        ? `${animal.location.name}${animal.location.city ? `, ${animal.location.city}` : ""}${animal.location.state ? `, ${animal.location.state}` : ""}`
        : null,
    },
  ].filter((item) => item.value);

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push("/animals")}
            className="flex items-center gap-1 hover:text-green-600 transition-colors"
          >
            <FaChevronLeft className="w-3 h-3" /> Animals
          </button>
          {animal.species && (
            <>
              <span>/</span>
              <button
                onClick={() =>
                  router.push(`/animals?species=${animal.species}`)
                }
                className="hover:text-green-600 transition-colors"
              >
                {animal.species}
              </button>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium">
            {animal.name || animal.tagId}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3 relative">
              {images[selectedImage]?.full ? (
                <img
                  src={images[selectedImage].full}
                  alt={animal.name || animal.tagId}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                  <FaPaw className="w-24 h-24 text-green-200" />
                </div>
              )}

              {/* Species Badge on image */}
              <div className="absolute top-4 left-4">
                <span
                  className={`text-sm font-bold px-3 py-1.5 rounded-full border ${speciesStyle}`}
                >
                  {animal.species}
                </span>
              </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      selectedImage === i
                        ? "border-green-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img.thumb || img.full}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div>
            {/* Breed label */}
            {animal.breed && (
              <span className="text-sm text-green-600 font-medium uppercase tracking-wide">
                {animal.breed}
              </span>
            )}

            {/* Name / Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-2">
              {animal.name || `${animal.species} — ${animal.tagId}`}
            </h1>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${speciesStyle}`}
              >
                {animal.species}
              </span>
              {animal.gender && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    animal.gender === "Male"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-pink-50 text-pink-700 border border-pink-200"
                  }`}
                >
                  {animal.gender === "Male" ? "♂" : "♀"} {animal.gender}
                </span>
              )}
              {animal.currentWeight > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {animal.currentWeight} kg
                </span>
              )}
              {ageDisplay && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {ageDisplay}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-green-50 rounded-xl p-5 mb-6 border border-green-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-green-800">
                  {formatCurrency(animal.projectedSalesPrice, "NGN")}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Asking price • Negotiable
              </p>
            </div>

            {/* Inquiry Buttons */}
            <div className="flex gap-3 mb-6">
              <a
                href={`https://wa.me/?text=Hi, I'm interested in ${animal.name || animal.tagId} (${animal.species}${animal.breed ? ` - ${animal.breed}` : ""}) listed at ${formatCurrency(animal.projectedSalesPrice, "NGN")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <FaWhatsapp className="w-5 h-5" />
                Inquire via WhatsApp
              </a>
              <a
                href={`mailto:store@farm.com?subject=Inquiry: ${animal.name || animal.tagId}&body=Hi, I'm interested in ${animal.name || animal.tagId} (${animal.species}${animal.breed ? ` - ${animal.breed}` : ""}) listed at ${formatCurrency(animal.projectedSalesPrice, "NGN")}`}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg transition-all"
              >
                <FaEnvelope className="w-4 h-4" />
              </a>
            </div>

            {/* Notes */}
            {animal.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  About this Animal
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {animal.notes}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Details
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {detailItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 py-2 border-b border-gray-50"
                  >
                    <item.icon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-800 font-medium">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-5 border-t border-gray-100">
              <div className="flex flex-col items-center text-center gap-1.5 p-3">
                <FaCheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Health Verified
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3">
                <FaTruck className="w-5 h-5 text-green-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Delivery Available
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3">
                <FaShieldAlt className="w-5 h-5 text-green-500" />
                <span className="text-xs text-gray-600 font-medium">
                  Quality Guaranteed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Animals */}
        {relatedAnimals?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Similar Animals
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {relatedAnimals.map((a) => (
                <AnimalCard key={a._id} animal={a} />
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
      `${baseUrl}/api/store/animals/${params.id}`
    );
    return {
      props: {
        animal: data.animal,
        relatedAnimals: data.relatedAnimals || [],
      },
    };
  } catch {
    return { props: { animal: null, relatedAnimals: [] } };
  }
}
