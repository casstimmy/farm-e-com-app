import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import axios from "axios";
import { formatCurrency } from "@/utils/formatting";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaSyncAlt,
  FaTimes,
  FaStar,
  FaImage,
} from "react-icons/fa";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    unit: "",
    stockQuantity: "",
    lowStockThreshold: "5",
    category: "",
    images: [""],
    tags: "",
    isFeatured: false,
    isActive: true,
    weight: "",
    weightUnit: "kg",
    sku: "",
    trackInventory: true,
  };

  const [form, setForm] = useState(emptyForm);

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { Authorization: "Bearer " + token };
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/store/products", {
        headers: getHeaders(),
        params: { search, category: categoryFilter },
      });
      setProducts(res.data.products || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/admin/store/categories", {
        headers: getHeaders(),
      });
      setCategories(res.data.categories || res.data || []);
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const openAddModal = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditing(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      shortDescription: product.shortDescription || "",
      price: product.price ?? "",
      compareAtPrice: product.compareAtPrice ?? "",
      costPrice: product.costPrice ?? "",
      unit: product.unit || "",
      stockQuantity: product.stockQuantity ?? "",
      lowStockThreshold: product.lowStockThreshold ?? "5",
      category: product.category?._id || product.category || "",
      images:
        product.images?.length > 0
          ? [...product.images]
          : [""],
      tags: Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "",
      isFeatured: product.isFeatured || false,
      isActive: product.isActive !== false,
      weight: product.weight ?? "",
      weightUnit: product.weightUnit || "kg",
      sku: product.sku || "",
      trackInventory: product.trackInventory !== false,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleImageChange = (index, value) => {
    const imgs = [...form.images];
    imgs[index] = value;
    setForm((f) => ({ ...f, images: imgs }));
  };

  const addImageField = () => {
    setForm((f) => ({ ...f, images: [...f.images, ""] }));
  };

  const removeImageField = (index) => {
    const imgs = form.images.filter((_, i) => i !== index);
    setForm((f) => ({ ...f, images: imgs.length > 0 ? imgs : [""] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        compareAtPrice: form.compareAtPrice
          ? parseFloat(form.compareAtPrice)
          : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        images: form.images.filter((img) => img.trim()),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editing) {
        await axios.put(
          `/api/admin/store/products/${editing._id}`,
          payload,
          { headers: getHeaders() }
        );
      } else {
        await axios.post("/api/admin/store/products", payload, {
          headers: getHeaders(),
        });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/admin/store/products/${id}`, {
        headers: getHeaders(),
      });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete product");
    }
  };

  const handleSyncInventory = async () => {
    setSyncing(true);
    try {
      await axios.post("/api/admin/store/sync-inventory", {}, {
        headers: getHeaders(),
      });
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout title="Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500 text-sm">
              Manage your store products
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSyncInventory}
              disabled={syncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
            >
              <FaSyncAlt className={syncing ? "animate-spin" : ""} />
              Sync Inventory
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition"
            >
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
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
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Stock
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b last:border-b-0 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <FaImage className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">
                              {product.name}
                              {product.isFeatured && (
                                <FaStar className="inline ml-1 text-yellow-400 text-xs" />
                              )}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-400">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {product.category?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {formatCurrency(product.price || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-medium ${
                            (product.stockQuantity ?? 0) <=
                            (product.lowStockThreshold ?? 5)
                              ? "text-red-600"
                              : "text-gray-800"
                          }`}
                        >
                          {product.stockQuantity ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive !== false
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {product.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <Field label="Name *">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </Field>

              {/* Description */}
              <Field label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                />
              </Field>

              {/* Short Description */}
              <Field label="Short Description">
                <input
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  className="input"
                />
              </Field>

              {/* Pricing Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Price *">
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className="input"
                  />
                </Field>
                <Field label="Compare At Price">
                  <input
                    name="compareAtPrice"
                    type="number"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
                <Field label="Cost Price">
                  <input
                    name="costPrice"
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
              </div>

              {/* Unit & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Unit">
                  <input
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    placeholder="e.g. kg, piece, liter"
                    className="input"
                  />
                </Field>
                <Field label="SKU">
                  <input
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
              </div>

              {/* Stock Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Stock Quantity">
                  <input
                    name="stockQuantity"
                    type="number"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
                <Field label="Low Stock Threshold">
                  <input
                    name="lowStockThreshold"
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
              </div>

              {/* Category */}
              <Field label="Category">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images
                </label>
                {form.images.map((img, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={img}
                      onChange={(e) => handleImageChange(i, e.target.value)}
                      placeholder="Image URL"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageField(i)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  + Add image URL
                </button>
              </div>

              {/* Tags */}
              <Field label="Tags (comma-separated)">
                <input
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="organic, fresh, premium"
                  className="input"
                />
              </Field>

              {/* Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Weight">
                  <input
                    name="weight"
                    type="number"
                    step="0.01"
                    value={form.weight}
                    onChange={handleChange}
                    className="input"
                  />
                </Field>
                <Field label="Weight Unit">
                  <select
                    name="weightUnit"
                    value={form.weightUnit}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </Field>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <Toggle
                  label="Active"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                <Toggle
                  label="Featured"
                  name="isFeatured"
                  checked={form.isFeatured}
                  onChange={handleChange}
                />
                <Toggle
                  label="Track Inventory"
                  name="trackInventory"
                  checked={form.trackInventory}
                  onChange={handleChange}
                />
              </div>
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

      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
          transition: all 0.15s;
        }
        .input:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }
      `}</style>
    </AdminLayout>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, name, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
