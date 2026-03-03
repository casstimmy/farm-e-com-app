import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import { FaCalendar, FaUser, FaArrowRight, FaSearch } from "react-icons/fa";

export default function BlogPage() {
  const router = useRouter();
  const { slug, category = "all", page = 1 } = router.query;
  const [posts, setPosts] = useState([]);
  const [singlePost, setSinglePost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (!router.isReady) return;

    if (slug) {
      fetchSinglePost();
    } else {
      fetchPosts();
    }
  }, [router.isReady, slug, selectedCategory, page]);

  const fetchSinglePost = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/store/blog?slug=${slug}`);
      setSinglePost(data);
    } catch (error) {
      console.error("Failed to fetch post:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        category: selectedCategory === "all" ? undefined : selectedCategory,
        page: page || 1,
        limit: 10,
      };
      const { data } = await axios.get(`/api/store/blog`, { params });
      setPosts(data.posts);
      setCategories(data.categories);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    router.push(`/blog?category=${cat}`);
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </StoreLayout>
    );
  }

  // Single Post View
  if (singlePost) {
    return (
      <StoreLayout>
        <article className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-semibold"
          >
            ← Back to Blog
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                {singlePost.category}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <FaCalendar size={12} />
                {new Date(singlePost.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <FaUser size={12} />
                {singlePost.author}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {singlePost.title}
            </h1>
            <p className="text-xl text-gray-600">{singlePost.excerpt}</p>
          </motion.div>

          {/* Cover Image */}
          {singlePost.coverImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 rounded-2xl overflow-hidden shadow-xl"
            >
              <img
                src={singlePost.coverImage}
                alt={singlePost.title}
                className="w-full h-96 object-cover"
              />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-lg max-w-none text-gray-700 mb-8"
          >
            <div
              dangerouslySetInnerHTML={{
                __html: singlePost.content.replace(/\n/g, "<br>"),
              }}
            />
          </motion.div>

          {/* Tags */}
          {singlePost.tags && singlePost.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8 pt-8 border-t border-gray-200">
              {singlePost.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold hover:bg-indigo-200 cursor-pointer transition-all"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">
              👁️ <strong>{singlePost.views || 0}</strong> people have read this article
            </p>
          </div>
        </article>
      </StoreLayout>
    );
  }

  // Blog List View
  return (
    <StoreLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Farm <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Blog</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Learn about farming, fresh produce, and sustainable agriculture
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-purple-300 focus:outline-none focus:border-purple-500"
              />
              <FaSearch className="absolute right-4 top-4 text-gray-400" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-20">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedCategory === "all"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    All Articles
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-all flex justify-between items-center ${
                        selectedCategory === cat.name
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                      <span className="text-xs font-bold">{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Posts Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-3"
            >
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No articles found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post, idx) => (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-100 group"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        {/* Image */}
                        {post.coverImage && (
                          <div className="md:col-span-1 overflow-hidden rounded-lg h-48 md:h-auto">
                            <img
                              src={post.coverImage}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className={post.coverImage ? "md:col-span-2" : "md:col-span-3"}>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                            {post.isFeatured && (
                              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                ⭐ Featured
                              </span>
                            )}
                          </div>

                          <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                            {post.title}
                          </h2>

                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <FaCalendar size={12} />
                              {new Date(post.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              👁️ {post.views || 0} views
                            </span>
                          </div>

                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group/link"
                          >
                            Read Article
                            <FaArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Link
                        key={p}
                        href={`/blog?page=${p}&category=${selectedCategory}`}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          parseInt(page || 1) === p
                            ? "bg-purple-600 text-white"
                            : "bg-white text-gray-900 border-2 border-gray-300 hover:border-purple-600"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
