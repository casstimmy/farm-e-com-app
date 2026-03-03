import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";

export default function StoreRegisterPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const { register, verifyEmail, isAuthenticated } = useStore();

  // View: "register" | "verify"
  const [view, setView] = useState("register");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      if (result.requiresVerification) {
        setView("verify");
        setSuccess("A verification code has been sent to your email.");
        setResendCooldown(60);
        setTimeout(() => codeInputRef.current?.focus(), 200);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await verifyEmail(form.email, verificationCode);
      // Navigation is handled by the useEffect watching isAuthenticated
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed. Please check the code.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setSuccess("A new verification code has been sent to your email.");
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code.");
    }
  };

  const fields = [
    { name: "firstName", label: "First Name", type: "text", icon: FaUser, required: true, half: true },
    { name: "lastName", label: "Last Name", type: "text", icon: FaUser, required: true, half: true },
    { name: "email", label: "Email Address", type: "email", icon: FaEnvelope, required: true, autoComplete: "email" },
    { name: "phone", label: "Phone Number", type: "tel", icon: FaPhone, required: false, placeholder: "+234..." },
    { name: "password", label: "Password", type: "password", icon: FaLock, required: true, placeholder: "Min. 8 characters", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Confirm Password", type: "password", icon: FaLock, required: true, autoComplete: "new-password" },
  ];

  return (
    <StoreLayout>
      <Head>
        <title>Create Account | Farm Store</title>
      </Head>

      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

            {/* ── Register Form ── */}
            {view === "register" && (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Join us to shop fresh farm products
                  </p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {fields
                      .filter((f) => f.half)
                      .map((f) => (
                        <div key={f.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {f.label} {f.required && <span className="text-red-400">*</span>}
                          </label>
                          <div className="relative">
                            <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={f.type}
                              name={f.name}
                              required={f.required}
                              value={form[f.name]}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                              placeholder={f.placeholder || f.label}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  {fields
                    .filter((f) => !f.half)
                    .map((f) => (
                      <div key={f.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {f.label} {f.required && <span className="text-red-400">*</span>}
                        </label>
                        <div className="relative">
                          <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={f.type}
                            name={f.name}
                            required={f.required}
                            autoComplete={f.autoComplete}
                            value={form[f.name]}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            placeholder={f.placeholder || f.label}
                          />
                        </div>
                      </div>
                    ))}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                  >
                    {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Already have an account?{" "}
                  <Link
                    href={`/auth/login${redirect ? `?redirect=${redirect}` : ""}`}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Sign In
                  </Link>
                </p>
              </>
            )}

            {/* ── Verification Step ── */}
            {view === "verify" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaEnvelope className="w-6 h-6 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Verify Your Email
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-sm font-medium text-gray-700">{form.email}</p>
                </div>

                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2">
                    <FaCheckCircle className="flex-shrink-0" />
                    {success}
                  </div>
                )}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <input
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-[0.5em] font-mono"
                      placeholder="000000"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
                  >
                    {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>
                </form>

                <div className="text-center mt-5">
                  <p className="text-sm text-gray-400">
                    Didn&apos;t receive the code?{" "}
                    {resendCooldown > 0 ? (
                      <span className="text-gray-400">Resend in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Resend Code
                      </button>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => { setView("register"); setError(""); setSuccess(""); }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3"
                >
                  ← Go back to registration
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
