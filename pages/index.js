import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import AnimalCard from "@/components/store/AnimalCard";
import InventoryCard from "@/components/store/InventoryCard";
import ServiceCard from "@/components/store/ServiceCard";
import { useStore } from "@/context/StoreContext";
import { formatCurrency } from "@/utils/formatting";
import { fetchHomepageData } from "@/lib/homepageData";
import {
  FaPaw,
  FaBoxOpen,
  FaConciergeBell,
  FaArrowRight,
  FaShieldAlt,
  FaTruck,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";

export async function getStaticProps() {
  try {
    const featuredData = await fetchHomepageData();
    return {
      props: {
        initialData: JSON.parse(JSON.stringify(featuredData)),
      },
      revalidate: 30,
    };
  } catch (error) {
    console.error("Homepage static data error:", error);
    return {
      props: {
        initialData: {
          animals: [],
          inventoryItems: [],
          services: [],
          animalCategories: [],
          totals: { animals: 0, products: 0, services: 0 },
        },
      },
      revalidate: 15,
    };
  }
}

export default function HomePage({ initialData }) {
  const router = useRouter();
  const { addToCart, isAuthenticated } = useStore();
  const [data] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/animals?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleHomeAddToCart = async (item) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/")}`);
      return;
    }
    try {
      await addToCart(null, 1, item._id);
      setNotice(`${item.item} added to cart`);
      setTimeout(() => setNotice(""), 2200);
    } catch (error) {
      setNotice(error.response?.data?.error || "Failed to add to cart");
      setTimeout(() => setNotice(""), 2600);
    }
  };

  const handleHomeAnimalAddToCart = async (animal) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent("/")}`);
      return;
    }
    try {
      await addToCart(null, 1, null, { animalId: animal._id });
      setNotice(`${animal.name || animal.tagId || "Animal"} added to cart`);
      setTimeout(() => setNotice(""), 2200);
    } catch (error) {
      setNotice(error.response?.data?.error || "Failed to add to cart");
      setTimeout(() => setNotice(""), 2600);
    }
  };

  // Species emoji/icon mapping
  const speciesEmoji = {
    Goat: "🐐",
    Sheep: "🐑",
    Cattle: "🐄",
    Cow: "🐄",
    Chicken: "🐔",
    Poultry: "🐔",
    Pig: "🐷",
    Rabbit: "🐰",
    Fish: "🐟",
    Turkey: "🦃",
    Duck: "🦆",
    Horse: "🐴",
  };

  return (
    <StoreLayout>
      {notice && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium">
          {notice}
        </div>
      )}
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
            >
              Quality Livestock,{" "}
              <span className="text-green-300">Farm Products</span> &{" "}
              <span className="text-emerald-300">Services</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-xl text-green-100 mb-8 leading-relaxed"
            >
              Browse healthy, well-raised animals for sale, farm supplies, and
              professional agricultural services — all from one trusted source.
            </motion.p>

            {/* Search */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch}
              className="flex max-w-lg"
            >
              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search animals, products, services..."
                  className="w-full pl-11 pr-4 py-4 rounded-l-xl bg-white text-gray-900 placeholder:text-gray-500 border border-white/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                />
              </div>
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-400 text-white font-semibold px-8 rounded-r-xl transition-colors"
              >
                Search
              </button>
            </motion.form>

            {/* Quick stats */}
            {data?.totals && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-6 mt-10 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FaPaw className="w-5 h-5 text-green-300" />
                  <span>
                    <strong className="text-white">{data.totals.animals}</strong>{" "}
                    <span className="text-green-200">Animals</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaBoxOpen className="w-5 h-5 text-green-300" />
                  <span>
                    <strong className="text-white">{data.totals.products}</strong>{" "}
                    <span className="text-green-200">Products</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FaConciergeBell className="w-5 h-5 text-green-300" />
                  <span>
                    <strong className="text-white">{data.totals.services}</strong>{" "}
                    <span className="text-green-200">Services</span>
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Animal Categories Section */}
      {data?.animalCategories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Browse by Animal Type
              </h2>
              <p className="text-gray-500 mt-1">
                Select a category to browse available livestock
              </p>
            </div>
            <Link
              href="/animals"
              className="hidden sm:flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
            >
              View All Animals <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.animalCategories.map((cat, i) => (
              <motion.div
                key={cat.species}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/animals?species=${encodeURIComponent(cat.species)}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-5 text-center"
                >
                  {cat.image ? (
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 border-2 border-gray-100 group-hover:border-green-400 transition-colors">
                      <img
                        src={cat.image}
                        alt={cat.species}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-5xl mb-3">
                      {speciesEmoji[cat.species] || "🐾"}
                    </div>
                  )}
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                    {cat.species}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {cat.count} available
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    From {formatCurrency(cat.avgPrice, "NGN")}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="sm:hidden mt-4 text-center">
            <Link
              href="/animals"
              className="inline-flex items-center gap-2 text-green-600 font-medium text-sm"
            >
              View All Animals <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Animals */}
      {data?.animals?.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Featured Animals
                </h2>
                <p className="text-gray-500 mt-1">
                  Latest livestock available for purchase
                </p>
              </div>
              <Link
                href="/animals"
                className="hidden sm:flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Browse All <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {data.animals.slice(0, 6).map((animal, i) => (
                <motion.div
                  key={animal._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AnimalCard animal={animal} onAddToCart={handleHomeAnimalAddToCart} />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/animals"
                className="inline-flex items-center gap-2 text-green-600 font-medium text-sm"
              >
                Browse All Animals <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Farm Shop / Inventory Products */}
      {data?.inventoryItems?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Farm Shop
              </h2>
              <p className="text-gray-500 mt-1">
                Feed, medications, supplies, and equipment
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              View All Products <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.inventoryItems.slice(0, 6).map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <InventoryCard
                  item={item}
                  onAddToCart={handleHomeAddToCart}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-amber-600 font-medium text-sm"
            >
              View All Products <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* Services Section */}
      {data?.services?.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Our Services
                </h2>
                <p className="text-gray-500 mt-1">
                  Professional farm & veterinary services
                </p>
              </div>
              <Link
                href="/services"
                className="hidden sm:flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View All Services <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.services.slice(0, 6).map((service, i) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-blue-600 font-medium text-sm"
              >
                View All Services <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaCheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Verified & Healthy
              </h3>
              <p className="text-sm text-gray-500">
                All animals are health-checked and come with records
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaTruck className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Delivery Available
              </h3>
              <p className="text-sm text-gray-500">
                We deliver animals and products to your location
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <FaShieldAlt className="w-7 h-7 text-purple-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Quality Guaranteed
              </h3>
              <p className="text-sm text-gray-500">
                Backed by our farm&apos;s reputation and quality standards
              </p>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
