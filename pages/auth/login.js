import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import {
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";

export default function StoreLoginPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const { login, isAuthenticated, businessSettings } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTarget = useMemo(() => {
    const raw = Array.isArray(redirect) ? redirect[0] : redirect;
    if (!raw) return "/";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [redirect]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget);
    }
  }, [isAuthenticated, redirectTarget, router]);

  if (isAuthenticated) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      await router.push(redirectTarget);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <div className="min-h-[78vh] flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-6xl rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-xl grid grid-cols-1 lg:grid-cols-2">
          <div className="relative hidden lg:flex min-h-[640px] p-10 text-white">
            {businessSettings?.loginHeroImage && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${businessSettings.loginHeroImage})`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/85 via-green-800/80 to-emerald-700/75" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_20%_90%,rgba(16,185,129,0.25),transparent_45%)]" />

            <div className="relative z-10 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-emerald-100 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <FaShieldAlt className="w-3 h-3" />
                  Secure Access
                </p>
                <h1 className="mt-6 text-4xl font-extrabold leading-tight">
                  Welcome Back to {businessSettings?.businessName || "Farm Store"}
                </h1>
                <p className="mt-4 text-emerald-100/95 max-w-md">
                  Sign in to manage orders, checkout faster, and track every
                  purchase in one place.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-emerald-100">
                  <FaCheckCircle className="w-4 h-4 text-emerald-300" />
                  Faster checkout and saved delivery info
                </div>
                <div className="flex items-center gap-2.5 text-sm text-emerald-100">
                  <FaCheckCircle className="w-4 h-4 text-emerald-300" />
                  Real-time order and payment status
                </div>
                <div className="flex items-center gap-2.5 text-sm text-emerald-100">
                  <FaCheckCircle className="w-4 h-4 text-emerald-300" />
                  Direct access to account and invoices
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 lg:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-7">
                <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-500 mt-1.5">
                  Access your account dashboard
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="********"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : null}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/auth/register${redirect ? `?redirect=${redirect}` : ""}`}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}

