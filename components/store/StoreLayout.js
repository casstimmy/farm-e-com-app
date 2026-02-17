import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useStore } from "@/context/StoreContext";
import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaBars,
  FaTimes,
  FaLeaf,
  FaSignOutAlt,
  FaBoxOpen,
  FaChevronDown,
} from "react-icons/fa";

export default function StoreLayout({ children }) {
  const router = useRouter();
  const { customer, isAuthenticated, logout, cart } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-green-800 text-green-100 text-xs py-1.5 px-4 text-center">
        Fresh from the farm — Quality livestock products delivered to your door
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                <FaLeaf className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                {process.env.NEXT_PUBLIC_APP_NAME || "Farm Store"}
              </span>
            </Link>

            {/* Search bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-lg mx-8"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-green-600"
                >
                  <FaSearch className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
              >
                <FaShoppingCart className="w-5 h-5" />
                {cart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cart.itemCount > 9 ? "9+" : cart.itemCount}
                  </span>
                )}
              </Link>

              {/* User menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-2 text-gray-600 hover:text-green-600 transition-colors text-sm"
                  >
                    <FaUser className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">
                      {customer?.firstName}
                    </span>
                    <FaChevronDown className="w-3 h-3" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                        >
                          <FaUser className="inline mr-2 w-3.5 h-3.5" />
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700"
                        >
                          <FaBoxOpen className="inline mr-2 w-3.5 h-3.5" />
                          My Orders
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FaSignOutAlt className="inline mr-2 w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-green-700 hover:text-green-800 border border-green-600 rounded-lg px-4 py-1.5 hover:bg-green-50 transition-all"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600"
              >
                {mobileMenuOpen ? (
                  <FaTimes className="w-5 h-5" />
                ) : (
                  <FaBars className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <form onSubmit={handleSearch} className="mt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400"
                  >
                    <FaSearch className="w-4 h-4" />
                  </button>
                </div>
              </form>
              <nav className="mt-3 space-y-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 rounded-lg"
                >
                  All Products
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-green-50 rounded-lg"
                >
                  Cart ({cart.itemCount})
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <FaLeaf className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-white">
                  {process.env.NEXT_PUBLIC_APP_NAME || "Farm Store"}
                </span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Quality farm products, livestock feed, medications, and services
                — direct from the farm to your door.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-green-400 transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-green-400 transition-colors">
                    Cart
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="hover:text-green-400 transition-colors">
                    My Account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Email: store@farm.com</li>
                <li>Phone: +234 800 000 0000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME || "Farm Store"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
