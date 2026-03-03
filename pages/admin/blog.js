import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import PageHeader from "@/components/shared/PageHeader";
import Modal from "@/components/shared/Modal";
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaStar, FaRegStar } from "react-icons/fa";

export default function ManageBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "General",
    tags: "",
    status: "Draft",
    isFeatured: false,
    seoDescription: "",
    seoKeywords: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPosts();
  }, [filter, sort]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `/api/admin/store/blog?status=${filter}&sort=${sort}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(data.posts);
    } catch (err) {
      setError("Failed to fetch blog posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (post = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        category: post.category,
        tags: post.tags.join(", "),
        status: post.status,
        isFeatured: post.isFeatured,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords.join(", "),
      });
    } else {
      setEditingPost(null);
      setFormData({
        title: "",
        excerpt: "",
        content: "",
        coverImage: "",
        category: "General",
        tags: "",
        status: "Draft",
        isFeatured: false,
        seoDescription: "",
        seoKeywords: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingPost) {
        await axios.put(
          `/api/admin/store/blog/${editingPost._id}`,
          formData,
          config
        );
        setSuccess("Blog post updated successfully");
      } else {
        await axios.post(`/api/admin/store/blog`, formData, config);
        setSuccess("Blog post created successfully");
      }

      setShowModal(false);
      fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save blog post");
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/store/blog/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Blog post deleted successfully");
      fetchPosts();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete blog post");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Blog Management"
        subtitle="Create and manage blog posts"
        gradient="from-purple-600 to-pink-600"
        icon="📝"
      />

      {/* Alerts */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-4 flex-wrap items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Posts</option>
          <option value="Published">Published</option>
          <option value="Draft">Drafts</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="featured">Featured</option>
        </select>

        <button
          onClick={() => handleOpenForm()}
          className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
        >
          + New Post
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No blog posts yet</div>
        ) : (
          posts.map((post) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                {/* Thumbnail */}
                {post.coverImage && (
                  <div className="md:col-span-1">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Content */}
                <div className={post.coverImage ? "md:col-span-2" : "md:col-span-3"}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex-1">{post.title}</h3>
                    {post.isFeatured && (
                      <FaStar className="text-yellow-500 flex-shrink-0" title="Featured" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      post.status === "Published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {post.status}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {post.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      post.showOnSite
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {post.showOnSite ? "👁️ Visible" : "⊘ Hidden"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    👁️ {post.views || 0} views • {post.tags.length} tags
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => handleOpenForm(post)}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all font-semibold flex items-center justify-center gap-2"
                    title="Edit"
                  >
                    <FaPencilAlt size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-all font-semibold flex items-center justify-center gap-2"
                    title="Delete"
                  >
                    <FaTrash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPost ? "Edit Blog Post" : "Create New Blog Post"}
        size="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Post Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter post title"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            {formData.coverImage && (
              <img
                src={formData.coverImage}
                alt="Cover preview"
                className="mt-3 h-48 w-full object-cover rounded-lg"
                onError={() => setFormData({ ...formData, coverImage: "" })}
              />
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Excerpt/Summary
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary (appears in listings)"
              rows="2"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Content *
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your blog post content here..."
              rows="8"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 font-mono text-sm"
            />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option>General</option>
                <option>Farm Tips</option>
                <option>Products</option>
                <option>News</option>
                <option>Updates</option>
                <option>Guides</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="agriculture, farm, tips"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option>Draft</option>
                <option>Published</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-900">Mark as Featured</span>
              </label>
            </div>
          </div>

          {/* SEO */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              SEO Description
            </label>
            <input
              type="text"
              maxLength="160"
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              placeholder="Meta description for search engines (max 160 chars)"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.seoDescription.length}/160 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              {editingPost ? "Update Post" : "Create Post"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

ManageBlog.layoutType = "default";
ManageBlog.layoutProps = { title: "Blog Management" };
