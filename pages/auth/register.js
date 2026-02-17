import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import StoreLayout from "@/components/store/StoreLayout";
import { useStore } from "@/context/StoreContext";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaSpinner } from "react-icons/fa";

export default function StoreRegisterPage() {
  const router = useRouter();
  const { redirect } = router.query;
  const { register, isAuthenticated } = useStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      await router.push(redirectTarget);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const fields = [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      icon: <FaUser className="w-4 h-4" />,
      required: true,
      half: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      icon: <FaUser className="w-4 h-4" />,
      required: true,
      half: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      icon: <FaEnvelope className="w-4 h-4" />,
      required: true,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      icon: <FaPhone className="w-4 h-4" />,
      required: false,
      placeholder: "+234...",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      icon: <FaLock className="w-4 h-4" />,
      required: true,
      placeholder: "Min. 8 characters",
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      icon: <FaLock className="w-4 h-4" />,
      required: true,
    },
  ];

  return (
    <StoreLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Create Account
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Join us to shop fresh farm products
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {fields
                  .filter((f) => f.half)
                  .map((f) => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {f.label} {f.required && "*"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          {f.icon}
                        </span>
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
                      {f.label} {f.required && "*"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {f.icon}
                      </span>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60"
              >
                {loading ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : null}
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
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
