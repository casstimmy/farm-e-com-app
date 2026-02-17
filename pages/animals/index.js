import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { motion } from "framer-motion";
import StoreLayout from "@/components/store/StoreLayout";
import AnimalCard from "@/components/store/AnimalCard";
import { useStore } from "@/context/StoreContext";
import dbConnect from "@/lib/mongodb";
import AnimalModel from "@/models/Animal";
import {
  FaFilter,
  FaTimes,
  FaSpinner,
  FaSortAmountDown,
  FaPaw,
  FaSearch,
} from "react-icons/fa";

export async function getServerSideProps({ query }) {
  try {
    await dbConnect();
    const { species, breed, gender, sort = "newest", search, page = 1, limit = 20 } = query;
    const filter = { status: "Alive", isArchived: { $ne: true }, projectedSalesPrice: { $gt: 0 } };
    if (species) filter.species = { $regex: new RegExp(`^${species}$`, "i") };
    if (breed) filter.breed = { $regex: new RegExp(breed, "i") };
    if (gender) filter.gender = gender;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: searchRegex }, { tagId: searchRegex }, { breed: searchRegex }, { species: searchRegex }];
    }
    const sortMap = { newest: { createdAt: -1 }, price_asc: { projectedSalesPrice: 1 }, price_desc: { projectedSalesPrice: -1 }, weight_desc: { currentWeight: -1 }, name_asc: { name: 1 } };
    const sortOption = sortMap[sort] || sortMap.newest;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * perPage;
    const [animals, totalCount, speciesCounts] = await Promise.all([
      AnimalModel.find(filter).sort(sortOption).skip(skip).limit(perPage)
        .populate("location", "name city state")
        .select("-purchaseCost -totalFeedCost -totalMedicationCost -marginPercent -sire -dam -recordedBy -isArchived -archivedAt -archivedReason")
        .lean(),
      AnimalModel.countDocuments(filter),
      AnimalModel.aggregate([
        { $match: { status: "Alive", isArchived: { $ne: true }, projectedSalesPrice: { $gt: 0 } } },
        { $group: { _id: "$species", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);
    let breedCounts = [];
    if (species) {
      breedCounts = await AnimalModel.aggregate([
        { $match: { species: { $regex: new RegExp(`^${species}$`, "i") }, status: "Alive", isArchived: { $ne: true }, projectedSalesPrice: { $gt: 0 } } },
        { $group: { _id: "$breed", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
    }
    return {
      props: {
        initialAnimals: JSON.parse(JSON.stringify(animals)),
        initialSpecies: speciesCounts.map((s) => ({ name: s._id, count: s.count })),
        initialBreeds: breedCounts.map((b) => ({ name: b._id, count: b.count })),
        initialPagination: { page: pageNum, limit: perPage, totalCount, totalPages: Math.ceil(totalCount / perPage), hasMore: pageNum * perPage < totalCount },
        initialFilters: { species: species || "", breed: breed || "", gender: gender || "", sort: sort || "newest", search: search || "" },
      },
    };
  } catch (error) {
    console.error("Animals SSR error:", error);
    return { props: { initialAnimals: [], initialSpecies: [], initialBreeds: [], initialPagination: {}, initialFilters: {} } };
  }
}

/**
 * Animals Listing Page
 * /animals
 */
export default function AnimalsPage({ initialAnimals, initialSpecies, initialBreeds, initialPagination, initialFilters }) {
  const router = useRouter();
  const { addToCart, isAuthenticated } = useStore();
  const [animals, setAnimals] = useState(initialAnimals);
  const [speciesCategories, setSpeciesCategories] = useState(initialSpecies);
  const [breedCategories, setBreedCategories] = useState(initialBreeds);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(initialPagination);
  const [showFilters, setShowFilters] = useState(false);
  const [notice, setNotice] = useState("");
  const [hasInteracted, setHasInteracted] = useState(
    (initialAnimals?.length || 0) === 0
  );

  // Filters
  const [selectedSpecies, setSelectedSpecies] = useState(initialFilters.species || "");
  const [selectedBreed, setSelectedBreed] = useState(initialFilters.breed || "");
  const [selectedGender, setSelectedGender] = useState(initialFilters.gender || "");
  const [sortBy, setSortBy] = useState(initialFilters.sort || "newest");
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || "");

  const fetchAnimals = useCallback(async () => {
    if (!hasInteracted) return;
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
  }, [selectedSpecies, selectedBreed, selectedGender, sortBy, searchTerm, router.query.page, hasInteracted]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const clearFilters = () => {
    setHasInteracted(true);
    setSelectedSpecies("");
    setSelectedBreed("");
    setSelectedGender("");
    setSortBy("newest");
    setSearchTerm("");
    router.push("/animals", undefined, { shallow: true });
  };

  const handleSpeciesSelect = (species) => {
    setHasInteracted(true);
    setSelectedSpecies(species);
    setSelectedBreed(""); // Reset breed when species changes
  };

  const handleFilterChange = (setter) => (val) => {
    setHasInteracted(true);
    setter(val);
  };

  const hasActiveFilters =
    selectedSpecies || selectedBreed || selectedGender || searchTerm || sortBy !== "newest";

  const totalAnimals = speciesCategories.reduce((sum, s) => sum + s.count, 0);

  const handleDirectAddToCart = async (animal) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath || "/animals")}`);
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

  return (
    <StoreLayout>
      {notice && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium">
          {notice}
        </div>
      )}
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
              onChange={(e) => handleFilterChange(setSearchTerm)(e.target.value)}
              placeholder="Search by name, tag ID, breed, color..."
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => handleFilterChange(setSearchTerm)("")}
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
                        onClick={() => handleFilterChange(setSelectedBreed)("")}
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
                          onClick={() => handleFilterChange(setSelectedBreed)(b.name)}
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
                      onClick={() => handleFilterChange(setSelectedGender)(g)}
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
                  onChange={(e) => handleFilterChange(setSortBy)(e.target.value)}
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
                        onClick={() => handleFilterChange(setSelectedBreed)("")}
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
                          onClick={() => handleFilterChange(setSelectedBreed)(b.name)}
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
                        onClick={() => handleFilterChange(setSelectedGender)(g)}
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
                      <AnimalCard animal={animal} onAddToCart={handleDirectAddToCart} />
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
