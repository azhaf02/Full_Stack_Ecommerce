import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { ShoppingBag, Eye, EyeOff, Loader2, Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft } from "lucide-react";
import { login, getSession } from "../../services/authService";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already logged in as admin: skip the login page
  if (getSession()?.role === "admin") return <Navigate to="/admin" replace />;

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // stop the browser from reloading the page
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      // login() rejects wrong credentials and non-admin accounts
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // A dark "staff console" screen, so it is clearly different from the customer login
    <div
      className="min-h-screen bg-primary-900 text-primary-100 flex flex-col"
      style={{
        backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary-700 flex items-center justify-center">
            <ShoppingBag className="text-cream-100" size={16} />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.14em] text-white">VIORA</span>
          <span className="text-primary-500">/</span>
          <span className="text-sm text-primary-300">Admin Console</span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-xs font-medium text-primary-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to store
        </Link>
      </header>

      {/* Centered sign-in card */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-cream-50 text-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
            {/* Card header */}
            <div className="px-8 pt-8 pb-6 border-b bg-cream-100/60">
              <div className="flex items-start justify-between gap-4">
                <span className="w-12 h-12 rounded-xl bg-primary-800 flex items-center justify-center">
                  <ShieldCheck className="text-cream-100" size={22} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 bg-amber-100 rounded-full px-2.5 py-1">
                  Staff only
                </span>
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold text-primary-900">Administrator sign in</h1>
              <p className="text-sm text-slate-500 mt-1">Use your admin account to access the console.</p>
            </div>

            {/* Form */}
            <div className="px-8 py-7">
              {serverError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      className={`w-full border rounded-lg pl-10 pr-3 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 ${
                        errors.email ? "border-red-400" : ""
                      }`}
                      placeholder="name@company.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={Boolean(errors.password)}
                      className={`w-full border rounded-lg pl-10 pr-10 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 ${
                        errors.password ? "border-red-400" : ""
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-1.5">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-800 hover:bg-primary-900 active:scale-[0.99] disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold shadow-sm transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                  {loading ? "Signing in..." : "Sign in to console"}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-primary-300">
            Only accounts with the admin role can sign in here. Customers, please use the store login.
          </p>
        </div>
      </main>
    </div>
  );
}
