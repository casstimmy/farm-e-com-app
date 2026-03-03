import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { formatCurrency } from "@/utils/formatting";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaSave,
} from "react-icons/fa";

export default function AdminAnimals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alive");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [species, setSpecies] = useState([]);

  const emptyForm = {
    name: "",
    species: "",
    breed: "",
    tagId: "",
    gender: "Male",
    status: "Alive",
    currentWeight: "",
    dob: "",
    color: "",
    purchaseCost: "",
    marginPercent: "30",
    projectedSalesPrice: "",
    salesPrice: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: "Bearer " + token };
  };

  const fetchAnimals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/store/animals", {
        headers: getHeaders(),
        params: { 
          search, 
          species: speciesFilter,
          status: statusFilter,
        },
      });
      setAnimals(Array.isArray(res.data) ? res.data : res.data.animals || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load animals");
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  }, [search, speciesFilter, statusFilter]);

  const fetchSpecies = async () => {
    try {
      const res = await axios.get("/api/store/animals", {
        params: { limit: 1 }
      });
      // Extract unique species from animals if available
      const uniqueSpecies = [...new Set(res.data?.animals?.map(a => a.species).filter(Boolean) || [])];
      setSpecies(uniqueSpecies);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchAnimals();
    fetchSpecies();
  }, [fetchAnimals]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (animal) => {
    setEditing(animal);
    setForm({
      name: animal.name || "",
      species: animal.species || "",
      breed: animal.breed || "",
      tagId: animal.tagId || "",
      gender: animal.gender || "Male",
      status: animal.status || "Alive",
      currentWeight: animal.currentWeight ?? "",
      dob: animal.dob ? new Date(animal.dob).toISOString().split("T")[0] : "",
      color: animal.color || "",
      purchaseCost: animal.purchaseCost ?? "",
      marginPercent: animal.marginPercent ?? "30",
      projectedSalesPrice: animal.projectedSalesPrice ?? "",
      salesPrice: animal.salesPrice ?? "",
      notes: animal.notes || "",
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editing) {
        // Update existing animal
        await axios.put(
          `/api/admin/store/animals/${editing._id}`,
          form,
          { headers: getHeaders() }
        );
        setSuccess("Animal updated successfully");
      } else {
        // Create new animal
        await axios.post("/api/admin/store/animals", form, {
          headers: getHeaders(),
        });
        setSuccess("Animal created successfully");
      }
      setShowModal(false);
      fetchAnimals();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save animal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this animal?")) return;
    
    try {
      await axios.delete(`/api/admin/store/animals/${id}`, {
        headers: getHeaders(),
      });
      setSuccess("Animal deleted successfully");
      fetchAnimals();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete animal");
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Animals Management</h1>
            <p className="text-gray-600 mt-2">Manage livestock inventory and pricing</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <span className="text-red-600 font-medium">{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <FaCheck className="w-4 h-4 text-green-600 mt-0.5" />
              <span className="text-green-600 font-medium">{success}</span>
              <button
                onClick={() => setSuccess("")}
                className="text-green-400 hover:text-green-600 ml-auto"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Tag ID, name, breed..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                <select
                  value={speciesFilter}
                  onChange={(e) => setSpeciesFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Species</option>
                  {species.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">All Status</option>
                  <option value="Alive">Alive</option>
                  <option value="Dead">Dead</option>
                  <option value="Sold">Sold</option>
                  <option value="Quarantined">Quarantined</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={openAddModal}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  Add Animal
                </button>
              </div>
            </div>
          </div>

          {/* Animals Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : animals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No animals found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Tag ID</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Species</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Breed</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Weight</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Sales Price</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {animals.map((animal) => (
                      <tr key={animal._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-900">{animal.tagId}</td>
                        <td className="px-6 py-4 text-gray-900">{animal.name || "—"}</td>
                        <td className="px-6 py-4 text-gray-700">{animal.species || "—"}</td>
                        <td className="px-6 py-4 text-gray-700">{animal.breed || "—"}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {animal.currentWeight > 0 ? `${animal.currentWeight} kg` : "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {animal.salesPrice > 0 
                            ? formatCurrency(animal.salesPrice, "NGN")
                            : animal.projectedSalesPrice > 0
                            ? formatCurrency(animal.projectedSalesPrice, "NGN")
                            : "Not set"
                          }
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              animal.status === "Alive"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {animal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => openEditModal(animal)}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <FaEdit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(animal._id)}
                            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                          >
                            <FaTrash className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Edit/Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? "Edit Animal" : "Add New Animal"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tag ID *
                      </label>
                      <input
                        type="text"
                        name="tagId"
                        value={form.tagId}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., GOAT-001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Animal name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Species *
                      </label>
                      <input
                        type="text"
                        name="species"
                        value={form.species}
                        onChange={handleFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Goat, Cattle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Breed
                      </label>
                      <input
                        type="text"
                        name="breed"
                        value={form.breed}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Boer, Friesian"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={form.dob}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Attributes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Attributes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Weight (kg)
                      </label>
                      <input
                        type="number"
                        name="currentWeight"
                        value={form.currentWeight}
                        onChange={handleFormChange}
                        min="0"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={form.color}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., Brown, White"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purchase Cost (NGN)
                      </label>
                      <input
                        type="number"
                        name="purchaseCost"
                        value={form.purchaseCost}
                        onChange={handleFormChange}
                        min="0"
                        step="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Margin %
                      </label>
                      <input
                        type="number"
                        name="marginPercent"
                        value={form.marginPercent}
                        onChange={handleFormChange}
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Projected Sales Price (NGN)
                      </label>
                      <input
                        type="number"
                        name="projectedSalesPrice"
                        value={form.projectedSalesPrice}
                        onChange={handleFormChange}
                        min="0"
                        step="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Sales Price (NGN)
                      </label>
                      <input
                        type="number"
                        name="salesPrice"
                        value={form.salesPrice}
                        onChange={handleFormChange}
                        min="0"
                        step="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder="Leave empty to use projected price"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="Alive">Alive</option>
                        <option value="Dead">Dead</option>
                        <option value="Sold">Sold</option>
                        <option value="Quarantined">Quarantined</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleFormChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional notes about this animal"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {saving ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <FaSave className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
