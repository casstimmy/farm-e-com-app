import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaTimes,
  FaSort,
} from "react-icons/fa";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    description: "",
    image: "",
    parent: "",
    sortOrder: "0",
    isActive: true,
  };

  const [form, setForm] = useState(emptyForm);

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: "Bearer " + token };
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/store/categories", {
        headers: getHeaders(),
      });
      setCategories(res.data.categories || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || "",
      description: cat.description || "",
      image: cat.image || "",
      parent: cat.parent?._id || cat.parent || "",
      sortOrder: cat.sortOrder ?? "0",
      isActive: cat.isActive !== false,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        sortOrder: parseInt(form.sortOrder) || 0,
        parent: form.parent || undefined,
      };

      if (editing) {
        await axios.put(
          `/api/admin/store/categories/${editing._id}`,
          payload,
          { headers: getHeaders() }
        );
      } else {
        await axios.post("/api/admin/store/categories", payload, {
          headers: getHeaders(),
        });
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`/api/admin/store/categories/${id}`, {
        headers: getHeaders(),
      });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category");
    }
  };

  // Build parent options excluding current editing category
  const parentOptions = categories.filter(
    (c) => !editing || c._id !== editing._id
  );

  return (
    <AdminLayout title="Categories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-500 text-sm">
              Organize your product categories
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
          >
            <FaPlus /> Add Category
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-2 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FaSpinner className="animate-spin text-green-600 text-2xl" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No categories yet. Create your first category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Slug
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      Products
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      <FaSort className="inline mr-1" />
                      Order
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((cat) => (
                      <tr
                        key={cat._id}
                        className="border-b last:border-b-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {cat.image && (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            )}
                            <span className="font-medium text-gray-800">
                              {cat.parent?.name ? (
                                <span className="text-gray-400 text-xs mr-1">
                                  {cat.parent.name} /
                                </span>
                              ) : null}
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                          {cat.slug || "—"}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {cat.productCount ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {cat.sortOrder ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              cat.isActive !== false
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {cat.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDelete(cat._id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              {/* Parent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Category
                </label>
                <select
                  name="parent"
                  value={form.parent}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  name="sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </form>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium flex items-center gap-2 transition"
              >
                {saving && <FaSpinner className="animate-spin" />}
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
