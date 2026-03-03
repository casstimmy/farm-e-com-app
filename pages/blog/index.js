import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import { motion } from "framer-motion";
import axios from "axios";
import StoreLayout from "@/components/store/StoreLayout";
import {
  FaCalendar,
  FaArrowRight,
  FaArrowLeft,
  FaSearch,
  FaEye,
  FaStar,
  FaTag,
} from "react-icons/fa";

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
        limit: 9,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const { data } = await axios.get("/api/store/blog", { params });
      setPosts(data.posts || []);
      setCategories(data.categories || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    router.push(`/blog?category=${cat}`, undefined, { shallow: true });
  };

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      fetchPosts();
    },
    [searchTerm, selectedCategory]
  );

  if (loading) {
    return (
      <StoreLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // ── Single Post View ──
  if (singlePost) {
    return (
      <StoreLayout>
        <Head>
          <title>{singlePost.title} | Blog</title>
          {singlePost.seoDescription && (
            <meta name="description" content={singlePost.seoDescription} />
          )}
        </Head>

        <article className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-8 text-sm font-medium"
          >
            <FaArrowLeft size={12} />
            Back to Blog
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Meta */}
            <div className="flex items-center gap-3 mb-4 flex-wrap text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md font-medium">
                <FaTag size={10} />
                {singlePost.category}
              </span>
              <span className="text-gray-400 flex items-center gap-1.5">
                <FaCalendar size={11} />
                {new Date(singlePost.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-gray-400 flex items-center gap-1.5">
                <FaEye size={11} />
                {singlePost.views || 0} views
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {singlePost.title}
            </h1>

            {singlePost.excerpt && (
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                {singlePost.excerpt}
              </p>
            )}

            {/* Cover Image */}
            {singlePost.coverImage && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={singlePost.coverImage}
                  alt={singlePost.title}
                  className="w-full h-64 sm:h-80 object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-gray prose-lg max-w-none mb-10 leading-relaxed [&_p]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-green-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_a]:text-green-600 [&_a]:underline">
              <div
                dangerouslySetInnerHTML={{
                  __html: singlePost.content.replace(/\n/g, "<br>"),
                }}
              />
            </div>

            {/* Tags */}
            {singlePost.tags && singlePost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-100">
                {singlePost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author / Stats */}
            <div className="mt-8 p-5 bg-gray-50 rounded-xl flex items-center justify-between text-sm text-gray-500">
              <span>
                By <strong className="text-gray-700">{singlePost.author || "Farm Team"}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <FaEye size={12} />
                {singlePost.views || 0} readers
              </span>
            </div>
          </motion.div>
        </article>
      </StoreLayout>
    );
  }

  // ── Blog List View ──
  return (
    <StoreLayout>
      <Head>
        <title>Blog | Farm Fresh Store</title>
        <meta name="description" content="Read our latest articles about farming, agriculture, and fresh produce" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Page Header */}
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Our Blog
              </h1>
              <p className="text-gray-500 mb-6">
                Tips, stories, and insights from the farm
              </p>

              {/* Search */}
              <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600"
                >
                  <FaSearch size={14} />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-56 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <nav className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Articles
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => handleCategoryChange(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                        selectedCategory === cat.name
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Posts Grid */}
            <div className="flex-1 min-w-0">
              {posts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg mb-2">No articles found</p>
                  <p className="text-gray-400 text-sm">Try a different category or search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.map((post, idx) => (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      {/* Image */}
                      {post.coverImage && (
                        <div className="h-44 overflow-hidden">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className="p-5">
                        {/* Category + Featured */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                            {post.category}
                          </span>
                          {post.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-xs font-medium">
                              <FaStar size={9} />
                              Featured
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors leading-snug">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaCalendar size={10} />
                            {new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaEye size={10} />
                            {post.views || 0}
                          </span>
                        </div>

                        {/* Read More */}
                        <Link
                          href={`/blog/${post.slug}`}
                          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium mt-4 group/link"
                        >
                          Read Article
                          <FaArrowRight size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <Link
                        key={p}
                        href={`/blog?page=${p}&category=${selectedCategory}`}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          parseInt(page || 1) === p
                            ? "bg-green-600 text-white"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-green-300"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
