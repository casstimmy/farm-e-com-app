import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import AnimalCard from "@/components/store/AnimalCard";
import {
  FaFilter,
  FaTimes,
  FaSpinner,
  FaSortAmountDown,
  FaPaw,
  FaSearch,
} from "react-icons/fa";

/**
 * Animals Listing Page
 * /animals
 *
 * Displays all animals for sale, organized by species categories
 * with sub-categories for breed, and sorting options.
 */
export default function AnimalsPage() {
  const router = useRouter();
  const [animals, setAnimals] = useState([]);
  const [speciesCategories, setSpeciesCategories] = useState([]);
  const [breedCategories, setBreedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [searchTerm, setSearchTerm] = useState("");

  // Sync with URL query params
  useEffect(() => {
    if (router.query.species) setSelectedSpecies(router.query.species);
    if (router.query.breed) setSelectedBreed(router.query.breed);
    if (router.query.gender) setSelectedGender(router.query.gender);
    if (router.query.sort) setSortBy(router.query.sort);
    if (router.query.search) setSearchTerm(router.query.search);
  }, [router.query]);

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
        page: router.query.page || 1,
        limit: 20,
      };
      if (selectedSpecies) params.species = selectedSpecies;
      if (selectedBreed) params.breed = selectedBreed;
      if (selectedGender) params.gender = selectedGender;
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get("/api/store/animals", { params });
      setAnimals(data.animals);
      setSpeciesCategories(data.speciesCategories || []);
      setBreedCategories(data.breedCategories || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch animals:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSpecies, selectedBreed, selectedGender, sortBy, searchTerm, router.query.page]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const clearFilters = () => {
    setSelectedSpecies("");
    setSelectedBreed("");
    setSelectedGender("");
    setSortBy("newest");
    setSearchTerm("");
    router.push("/animals", undefined, { shallow: true });
  };

  const handleSpeciesSelect = (species) => {
    setSelectedSpecies(species);
    setSelectedBreed(""); // Reset breed when species changes
  };

  const hasActiveFilters =
    selectedSpecies || selectedBreed || selectedGender || searchTerm || sortBy !== "newest";

  const totalAnimals = speciesCategories.reduce((sum, s) => sum + s.count, 0);

  return (
    <StoreLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <FaPaw className="w-8 h-8 text-green-200" />
            <h1 className="text-3xl font-bold">
              {selectedSpecies
                ? `${selectedSpecies}`
                : "Livestock for Sale"}
            </h1>
          </div>
          <p className="text-green-100 max-w-2xl">
            {searchTerm
              ? `Search results for "${searchTerm}"`
              : selectedSpecies
                ? `Browse our ${selectedSpecies.toLowerCase()} — select by breed, gender, weight and more.`
                : "Browse our healthy, well-raised animals. Filter by species, breed, gender, and more to find exactly what you need."}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-green-200">
            <span>{pagination.totalCount || totalAnimals} animals available</span>
            <span>•</span>
            <span>{speciesCategories.length} categories</span>
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
              placeholder="Search by name, tag ID, breed, color..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
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
          {/* Sidebar — Species & Breed Categories */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24 space-y-6">
              {/* Species Categories */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Animal Type
                </h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleSpeciesSelect("")}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        !selectedSpecies
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span>All Animals</span>
                      <span className="text-xs text-gray-400">{totalAnimals}</span>
                    </button>
                  </li>
                  {speciesCategories.map((cat) => (
                    <li key={cat.name}>
                      <button
                        onClick={() => handleSpeciesSelect(cat.name)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                          selectedSpecies === cat.name
                            ? "bg-green-50 text-green-700 font-medium"
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
              </div>

              {/* Breed Sub-Categories (shown when a species is selected) */}
              {selectedSpecies && breedCategories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                    Breed
                  </h3>
                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => setSelectedBreed("")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !selectedBreed
                            ? "bg-emerald-50 text-emerald-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        All Breeds
                      </button>
                    </li>
                    {breedCategories.map((b) => (
                      <li key={b.name}>
                        <button
                          onClick={() => setSelectedBreed(b.name)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                            selectedBreed === b.name
                              ? "bg-emerald-50 text-emerald-700 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span>{b.name}</span>
                          <span className="text-xs text-gray-400">{b.count}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gender Filter */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Gender
                </h3>
                <div className="flex gap-2">
                  {["", "Male", "Female"].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGender(g)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedGender === g
                          ? "bg-green-600 text-white"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {g || "All"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 py-2.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <FaTimes className="w-3 h-3" /> Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar + Mobile Filter */}
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
                  <option value="weight_desc">Weight: Heaviest</option>
                  <option value="weight_asc">Weight: Lightest</option>
                  <option value="age_desc">Age: Oldest</option>
                  <option value="age_asc">Age: Youngest</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-4">
                {/* Species */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Animal Type</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleSpeciesSelect("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        !selectedSpecies
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {speciesCategories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => handleSpeciesSelect(cat.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedSpecies === cat.name
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {cat.name} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Breed (mobile) */}
                {selectedSpecies && breedCategories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Breed</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBreed("")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          !selectedBreed
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        All
                      </button>
                      {breedCategories.map((b) => (
                        <button
                          key={b.name}
                          onClick={() => setSelectedBreed(b.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            selectedBreed === b.name
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {b.name} ({b.count})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender (mobile) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Gender</h4>
                  <div className="flex gap-2">
                    {["", "Male", "Female"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedGender === g
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {g || "All"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Animals Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <FaSpinner className="w-8 h-8 text-green-600 animate-spin" />
              </div>
            ) : animals.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <div className="text-gray-300 text-6xl mb-4">🐾</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No animals found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}"`
                    : "No animals match your current filters"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-5">
                  {animals.map((animal) => (
                    <motion.div
                      key={animal._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AnimalCard animal={animal} />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
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
                            pathname: "/animals",
                            query: { ...router.query, page },
                          })
                        }
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
