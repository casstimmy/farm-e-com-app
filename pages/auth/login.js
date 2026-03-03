import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import {
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaCheckCircle,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";

export default function StoreLoginPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const { login, forgotPassword, resetPassword, isAuthenticated, businessSettings } = useStore();

  // View: "login" | "forgot" | "reset"
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const codeInputRef = useRef(null);

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

  if (isAuthenticated) {
    return (
      <StoreLayout>
        <div className="min-h-[78vh] flex items-center justify-center">
          <div className="text-center">
            <FaSpinner className="w-6 h-6 text-green-600 animate-spin mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Redirecting...</p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Navigation is handled by the useEffect watching isAuthenticated
    } catch (err) {
      const msg = err.response?.data?.error || "Invalid email or password";
      setError(msg);
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("If an account exists with this email, a reset code has been sent.");
      setView("reset");
      setTimeout(() => codeInputRef.current?.focus(), 200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, resetCode, newPassword);
      // Navigation is handled by the useEffect watching isAuthenticated
    } catch (err) {
      const msg = err.response?.data?.error || "Reset failed. Check your code and try again.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <StoreLayout>
      <Head>
        <title>Sign In | {businessSettings?.businessName || "Farm Store"}</title>
      </Head>

      <div className="min-h-[78vh] flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-6xl rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm grid grid-cols-1 lg:grid-cols-2">
          {/* Left Hero */}
          <div className="relative hidden lg:flex min-h-[640px] p-10 text-white">
            {businessSettings?.loginHeroImage && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${businessSettings.loginHeroImage})` }}
              />
            )}
            <div className="absolute inset-0 bg-green-900/85" />

            <div className="relative z-10 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-green-100 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
                  <FaShieldAlt className="w-3 h-3" />
                  Secure Access
                </p>
                <h1 className="mt-6 text-4xl font-extrabold leading-tight">
                  Welcome Back to {businessSettings?.businessName || "Farm Store"}
                </h1>
                <p className="mt-4 text-green-100/90 max-w-md">
                  Sign in to manage orders, checkout faster, and track every purchase.
                </p>
              </div>

              <div className="space-y-3">
                {["Faster checkout and saved delivery info", "Real-time order and payment status", "Direct access to account and invoices"].map((text) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-green-100">
                    <FaCheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="p-6 sm:p-10 lg:p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">

              {/* ── Login View ── */}
              {view === "login" && (
                <>
                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                    <p className="text-sm text-gray-500 mt-1">Access your account</p>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          Forgot password?
                        </button>
                      </div>
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
                      {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
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
                </>
              )}

              {/* ── Forgot Password View ── */}
              {view === "forgot" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                    className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium mb-6"
                  >
                    <FaArrowLeft size={12} />
                    Back to Sign In
                  </button>

                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your email and we&apos;ll send you a reset code
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                    >
                      {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
                      {loading ? "Sending..." : "Send Reset Code"}
                    </button>
                  </form>
                </>
              )}

              {/* ── Reset Password View ── */}
              {view === "reset" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                    className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium mb-6"
                  >
                    <FaArrowLeft size={12} />
                    Back
                  </button>

                  <div className="mb-7">
                    <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the 6-digit code sent to <strong>{email}</strong>
                    </p>
                  </div>

                  {success && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm">
                      {success}
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Reset Code
                      </label>
                      <input
                        ref={codeInputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                        placeholder="000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Min. 8 characters"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          required
                          minLength={8}
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Re-enter password"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                    >
                      {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
                      {loading ? "Resetting..." : "Reset Password & Sign In"}
                    </button>
                  </form>

                  <p className="text-center text-sm text-gray-400 mt-4">
                    Didn&apos;t receive a code?{" "}
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Resend
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
