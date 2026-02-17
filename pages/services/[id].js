import { useRouter } from "next/router";
import StoreLayout from "@/components/store/StoreLayout";
import ServiceCard from "@/components/store/ServiceCard";
import { formatCurrency } from "@/utils/formatting";
import {
  FaChevronLeft,
  FaConciergeBell,
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaStethoscope,
  FaSeedling,
  FaGraduationCap,
  FaCogs,
  FaIndustry,
  FaTools,
  FaPaw,
  FaRecycle,
  FaEllipsisH,
} from "react-icons/fa";

export default function ServiceDetailPage({ service, relatedServices }) {
  const router = useRouter();
  const businessPhoneRaw = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+2348000000000";
  const whatsappPhone = businessPhoneRaw.replace(/\D/g, "");

  if (!service) {
    return (
      <StoreLayout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <FaConciergeBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Service Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            This service may no longer be available.
          </p>
          <button
            onClick={() => router.push("/services")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse Services
          </button>
        </div>
      </StoreLayout>
    );
  }

  const categoryIcons = {
    "Veterinary Services": FaStethoscope,
    "Breeding Services": FaPaw,
    "Feed & Nutrition": FaSeedling,
    "Training & Consultation": FaGraduationCap,
    "Processing & Value Addition": FaIndustry,
    "Equipment & Facilities": FaTools,
    "Animal Sales": FaPaw,
    "Waste Management": FaRecycle,
    Other: FaEllipsisH,
  };

  const categoryColors = {
    "Veterinary Services": "bg-red-100 text-red-600",
    "Breeding Services": "bg-pink-100 text-pink-600",
    "Feed & Nutrition": "bg-green-100 text-green-600",
    "Training & Consultation": "bg-blue-100 text-blue-600",
    "Processing & Value Addition": "bg-purple-100 text-purple-600",
    "Equipment & Facilities": "bg-amber-100 text-amber-600",
    "Animal Sales": "bg-emerald-100 text-emerald-600",
    "Waste Management": "bg-teal-100 text-teal-600",
    Other: "bg-gray-100 text-gray-600",
  };

  const Icon = categoryIcons[service.category] || FaConciergeBell;
  const iconColor = categoryColors[service.category] || "bg-gray-100 text-gray-600";

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push("/services")}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <FaChevronLeft className="w-3 h-3" /> Services
          </button>
          {service.category && (
            <>
              <span>/</span>
              <button
                onClick={() =>
                  router.push(`/services?category=${encodeURIComponent(service.category)}`)
                }
                className="hover:text-blue-600 transition-colors"
              >
                {service.category}
              </button>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700 font-medium">{service.name}</span>
        </div>

        {/* Service Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-start gap-5">
              <div
                className={`w-16 h-16 rounded-2xl ${iconColor} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {service.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 mb-3">
                  {service.name}
                </h1>

                {/* Price Section */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {service.price > 0
                      ? formatCurrency(service.price, "NGN")
                      : "Contact for pricing"}
                  </span>
                  {service.unit && service.price > 0 && (
                    <span className="text-sm text-gray-500">
                      per {service.unit}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {service.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  About This Service
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {service.notes && (
              <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {service.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  `Hi, I'm interested in your "${service.name}" service${
                    service.price > 0
                      ? ` (${formatCurrency(service.price, "NGN")}${service.unit ? ` per ${service.unit}` : ""})`
                      : ""
                  }.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <FaWhatsapp className="w-5 h-5" />
                WhatsApp Business
              </a>
              <a
                href={`tel:${businessPhoneRaw}`}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                <FaPhone className="w-5 h-5" />
                Call
              </a>
              <a
                href={`mailto:store@farm.com?subject=Service Inquiry: ${service.name}&body=Hi, I'd like to inquire about your "${service.name}" service.`}
                className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 hover:bg-white font-semibold py-3 px-6 rounded-lg transition-all"
              >
                <FaEnvelope className="w-5 h-5" />
                Email Us
              </a>
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
                Professional Team
              </p>
              <p className="text-xs text-gray-500">
                Experienced & certified
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <FaClock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Flexible Scheduling
              </p>
              <p className="text-xs text-gray-500">
                Available on your timeline
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <FaShieldAlt className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Satisfaction Guaranteed
              </p>
              <p className="text-xs text-gray-500">
                Quality you can trust
              </p>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {relatedServices?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Related Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedServices.map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

export async function getServerSideProps({ params, res }) {
  const mongoose = (await import("mongoose")).default;
  const { default: dbConnect } = await import("@/lib/mongodb");
  const { default: Service } = await import("@/models/Service");

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return { props: { service: null, relatedServices: [] } };
  }

  try {
    await dbConnect();

    const service = await Service.findOne({
      _id: params.id,
      showOnSite: true,
      isActive: true,
    }).lean();

    if (!service) {
      return { props: { service: null, relatedServices: [] } };
    }

    // Related services
    const relatedServices = await Service.find({
      _id: { $ne: service._id },
      category: service.category,
      showOnSite: true,
      isActive: true,
    })
      .limit(4)
      .lean();

    // Cache for 60 seconds, stale-while-revalidate for 5 min
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return {
      props: {
        service: JSON.parse(JSON.stringify(service)),
        relatedServices: JSON.parse(JSON.stringify(relatedServices)),
      },
    };
  } catch (error) {
    console.error("Service SSR error:", error);
    return { props: { service: null, relatedServices: [] } };
  }
}
