import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaTags,
  FaUsers,
  FaExchangeAlt,
  FaSignOutAlt,
  FaStore,
  FaBars,
  FaTimes,
  FaSyncAlt,
} from "react-icons/fa";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { href: "/admin/products", label: "Products", icon: FaBoxOpen },
  { href: "/admin/orders", label: "Orders", icon: FaShoppingCart },
  { href: "/admin/categories", label: "Categories", icon: FaTags },
  { href: "/admin/customers", label: "Customers", icon: FaUsers },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    if (user) {
      try {
        setAdmin(JSON.parse(user));
      } catch {
        setAdmin(null);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <FaStore className="text-green-600 text-xl" />
              <span className="font-bold text-lg text-gray-800">
                Store Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-sm text-green-600 hover:text-green-700 hidden sm:block"
            >
              View Store →
            </Link>
            {admin && (
              <span className="text-sm text-gray-500 hidden md:block">
                {admin.name || admin.email}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <FaSignOutAlt />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                }`}
              >
                <item.icon
                  className={isActive ? "text-green-600" : "text-gray-400"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 pt-16 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
