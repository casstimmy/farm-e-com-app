import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import ServiceCard from "@/components/store/ServiceCard";
import {
  FaFilter,
  FaTimes,
  FaSpinner,
  FaSortAmountDown,
  FaConciergeBell,
  FaSearch,
} from "react-icons/fa";

/**
 * Services Listing Page
 * /services
 *
 * Displays all farm services available to customers.
 * Filterable by service category and sortable.
 */
export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (router.query.category) setSelectedCategory(router.query.category);
    if (router.query.sort) setSortBy(router.query.sort);
    if (router.query.search) setSearchTerm(router.query.search);
  }, [router.query]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
        page: router.query.page || 1,
        limit: 20,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get("/api/store/services", { params });
      setServices(data.services);
      setCategories(data.categories || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchTerm, router.query.page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSortBy("newest");
    setSearchTerm("");
    router.push("/services", undefined, { shallow: true });
  };

  const hasActiveFilters = selectedCategory || searchTerm || sortBy !== "newest";

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <FaConciergeBell className="w-8 h-8 text-blue-200" />
            <h1 className="text-3xl font-bold">Our Services</h1>
          </div>
          <p className="text-blue-100 max-w-2xl">
            {searchTerm
              ? `Search results for "${searchTerm}"`
              : "Professional farm services — from veterinary care to breeding, nutrition consultation, and more."}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-blue-200">
            <span>{pagination.totalCount || 0} services available</span>
            <span>•</span>
            <span>{categories.length} categories</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar — Categories */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Service Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Services
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.name}>
                    <button
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedCategory === cat.name
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
                        {cat.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <FaTimes className="w-3 h-3" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-100 px-4 py-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-sm text-gray-600 font-medium"
              >
                <FaFilter className="w-3.5 h-3.5" />
                Categories
                {hasActiveFilters && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <FaSortAmountDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-none focus:ring-0 text-gray-700 font-medium bg-transparent cursor-pointer pr-8"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Mobile filters */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat.name
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Services Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="text-gray-300 text-6xl mb-4">🔧</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No services found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No services match your current filters"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {services.map((service) => (
                    <motion.div
                      key={service._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ServiceCard service={service} />
                    </motion.div>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() =>
                          router.push({
                            pathname: "/services",
                            query: { ...router.query, page },
                          })
                        }
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-blue-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
