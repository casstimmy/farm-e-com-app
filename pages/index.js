import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import ProductCard from "@/components/store/ProductCard";
import { useStore } from "@/context/StoreContext";
import { FaFilter, FaTimes, FaSpinner, FaSortAmountDown } from "react-icons/fa";

export default function StorePage() {
  const router = useRouter();
  const { addToCart, isAuthenticated } = useStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [addingToCart, setAddingToCart] = useState(null);
  const [notification, setNotification] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (router.query.search) setSearchTerm(router.query.search);
    if (router.query.category) setSelectedCategory(router.query.category);
    if (router.query.sort) setSortBy(router.query.sort);
  }, [router.query]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
        page: router.query.page || 1,
        limit: 20,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get("/api/store/products", { params });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchTerm, router.query.page]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/store/categories");
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setAddingToCart(productId);
    try {
      await addToCart(productId, 1);
      setNotification("Added to cart!");
      setTimeout(() => setNotification(""), 2000);
    } catch (error) {
      setNotification(error.response?.data?.error || "Failed to add to cart");
      setTimeout(() => setNotification(""), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSortBy("newest");
    setSearchTerm("");
    router.push("/", undefined, { shallow: true });
  };

  const hasActiveFilters = selectedCategory || searchTerm || sortBy !== "newest";

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm font-medium"
          >
            {notification}
          </motion.div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {searchTerm ? `Search: "${searchTerm}"` : "Our Products"}
          </h1>
          <p className="text-gray-500 mt-1">
            {pagination.totalCount
              ? `${pagination.totalCount} product${pagination.totalCount !== 1 ? "s" : ""} available`
              : "Browse our farm products"}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat._id
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                      {cat.productCount > 0 && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({cat.productCount})
                        </span>
                      )}
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

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-100 px-4 py-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 text-sm text-gray-600 font-medium"
              >
                <FaFilter className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
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
                  <option value="popular">Most Popular</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="lg:hidden bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setSelectedCategory(cat._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat._id
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="text-gray-300 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No products match your filters"}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ProductCard product={product} onAddToCart={handleAddToCart} />
                    </motion.div>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => router.push({ pathname: "/", query: { ...router.query, page } })}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
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
