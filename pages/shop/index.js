import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import InventoryCard from "@/components/store/InventoryCard";
import dbConnect from "@/lib/mongodb";
import Inventory from "@/models/Inventory";
import InventoryCategory from "@/models/InventoryCategory";
import {
  FaFilter,
  FaTimes,
  FaSpinner,
  FaSortAmountDown,
  FaBoxOpen,
  FaSearch,
} from "react-icons/fa";

export async function getServerSideProps({ query }) {
  try {
    await dbConnect();
    const { category, search, sort = "newest", page = 1, limit = 20 } = query;
    const filter = { showOnSite: true, quantity: { $gt: 0 } };
    if (category) filter.categoryId = category;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ item: searchRegex }, { category: searchRegex }, { categoryName: searchRegex }];
    }
    const sortMap = { newest: { createdAt: -1 }, price_asc: { salesPrice: 1 }, price_desc: { salesPrice: -1 }, name_asc: { item: 1 } };
    const sortOption = sortMap[sort] || sortMap.newest;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;
    const [items, totalCount, categories, categoryCounts] = await Promise.all([
      Inventory.find(filter).sort(sortOption).skip(skip).limit(perPage).populate("categoryId", "name description").select("-costPrice -marginPercent -totalConsumed -minStock -medication").lean(),
      Inventory.countDocuments(filter),
      InventoryCategory.find().sort({ name: 1 }).lean(),
      Inventory.aggregate([
        { $match: { showOnSite: true, quantity: { $gt: 0 } } },
        { $group: { _id: "$categoryId", count: { $sum: 1 }, categoryName: { $first: "$categoryName" } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    return {
      props: {
        initialItems: JSON.parse(JSON.stringify(items)),
        initialCategories: JSON.parse(JSON.stringify(categoryCounts.map((c) => ({ _id: c._id, name: c.categoryName || "Uncategorized", count: c.count })))),
        initialPagination: { page: pageNum, limit: perPage, totalCount, totalPages: Math.ceil(totalCount / perPage), hasMore: pageNum * perPage < totalCount },
        initialFilters: { category: category || "", search: search || "", sort: sort || "newest" },
      },
    };
  } catch (error) {
    console.error("Shop SSR error:", error);
    return { props: { initialItems: [], initialCategories: [], initialPagination: {}, initialFilters: {} } };
  }
}

/**
 * Inventory Products (Shop) Listing Page
 * /shop
 */
export default function ShopPage({ initialItems, initialCategories, initialPagination, initialFilters }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState(initialCategories);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(initialPagination);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || "");
  const [sortBy, setSortBy] = useState(initialFilters.sort || "newest");
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");

  // Track if this is the initial render (SSR data already loaded)
  const [hasInteracted, setHasInteracted] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!hasInteracted) return; // Skip fetch on initial load — SSR data is already present
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
        page: router.query.page || 1,
        limit: 20,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get("/api/store/inventory", { params });
      setItems(data.items);
      setCategories(data.categories || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchTerm, router.query.page, hasInteracted]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const clearFilters = () => {
    setHasInteracted(true);
    setSelectedCategory("");
    setSortBy("newest");
    setSearchTerm("");
    router.push("/shop", undefined, { shallow: true });
  };

  const handleCategoryChange = (cat) => {
    setHasInteracted(true);
    setSelectedCategory(cat);
  };

  const handleSortChange = (val) => {
    setHasInteracted(true);
    setSortBy(val);
  };

  const handleSearchChange = (val) => {
    setHasInteracted(true);
    setSearchTerm(val);
  };

  const hasActiveFilters = selectedCategory || searchTerm || sortBy !== "newest";

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <FaBoxOpen className="w-8 h-8 text-amber-200" />
            <h1 className="text-3xl font-bold">Farm Shop</h1>
          </div>
          <p className="text-amber-100 max-w-2xl">
            {searchTerm
              ? `Search results for "${searchTerm}"`
              : "Quality farm supplies, feed, medications, and equipment — everything you need for your farm."}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-amber-200">
            <span>{pagination.totalCount || 0} products available</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-xl">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search farm supplies..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
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
                Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      !selectedCategory
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Products
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id || cat.name}>
                    <button
                      onClick={() => handleCategoryChange(cat._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedCategory === cat._id
                          ? "bg-amber-50 text-amber-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
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
                  <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <FaSortAmountDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
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
                    onClick={() => handleCategoryChange("")}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-amber-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id || cat.name}
                      onClick={() => handleCategoryChange(cat._id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat._id
                          ? "bg-amber-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Items Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="text-gray-300 text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No products found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No products match your current filters"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                  {items.map((item) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <InventoryCard item={item} />
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
                            pathname: "/shop",
                            query: { ...router.query, page },
                          })
                        }
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? "bg-amber-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-amber-50"
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
