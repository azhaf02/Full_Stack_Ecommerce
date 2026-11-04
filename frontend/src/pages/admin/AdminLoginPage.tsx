import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import {
  ShoppingBag,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  PackageCheck,
  Users,
  LayoutDashboard,
} from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-primary-900 text-primary-100 flex flex-col">
      {/* Background: dot grid and two soft glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-30"
        style={{ background: "var(--color-sage)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-25 bg-primary-500"
      />

      {/* Top bar */}
      <header className="relative flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary-700 ring-1 ring-white/10 flex items-center justify-center">
            <ShoppingBag className="text-cream-100" size={16} />
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.14em] text-white">VIORA</span>
          <span className="text-primary-500">/</span>
          <span className="text-sm text-primary-300">Admin Console</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-3 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-primary-200 ring-1 ring-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--color-sage)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--color-sage)" }} />
            </span>
            Secure connection
          </span>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-200 ring-1 ring-white/10 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to store
        </Link>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Welcome panel (wide screens only) */}
          <section className="hidden lg:block animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-sage)" }}>
              Store management
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-white">
              Everything your store needs,
              <br />
              in one console.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-200">
              Track orders and payments, manage customers and products, and keep the catalog up to date.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                { icon: PackageCheck, text: "Orders, returns and payments" },
                { icon: Users, text: "Customers and admin roles" },
                { icon: LayoutDashboard, text: "Live dashboard and analytics" },
              ].map(({ icon: Icon, text }, i) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm text-primary-100 animate-fade-in"
                  style={{ animationDelay: `${150 + i * 120}ms` }}
                >
                  <span className="w-8 h-8 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
                    <Icon size={15} style={{ color: "var(--color-sage)" }} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-2">
              {["Role-based access", "Encrypted sign-in", "Actions audit-logged"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-primary-200 ring-1 ring-white/10"
                >
                  {badge}
                </span>
              ))}
            </div>
          </section>

          {/* Sign-in card */}
          <div className="relative w-full max-w-md mx-auto animate-fade-in">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-[2rem] blur-2xl opacity-40"
              style={{ background: "radial-gradient(circle at 50% 30%, var(--color-sage), transparent 70%)" }}
            />
            <div className="relative bg-cream-50 text-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Sage accent strip */}
              <div
                className="h-1.5"
                style={{ background: "linear-gradient(90deg, var(--color-sage-dark), var(--color-sage), #c6d2b6)" }}
              />

              {/* Card header */}
              <div className="px-8 pt-7 pb-6 border-b bg-cream-100/60">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-800), var(--color-sage-dark))" }}
                  >
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
                        className={`w-full border rounded-xl bg-white pl-10 pr-3 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-4 focus:ring-[#879b70]/20 focus:border-[#879b70] ${
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
                        className={`w-full border rounded-xl bg-white pl-10 pr-10 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-4 focus:ring-[#879b70]/20 focus:border-[#879b70] ${
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
                    className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#879b70]/40 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-sage-dark))" }}
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                    {loading ? "Signing in..." : "Sign in to console"}
                  </button>
                </form>
              </div>
            </div>

            <p className="relative mt-6 text-center text-xs text-primary-300">
              Only accounts with the admin role can sign in here. Customers, please use the store login.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative px-6 sm:px-10 pb-6 text-center text-[11px] text-primary-400">
        © {new Date().getFullYear()} VIORA · Admin Console
      </footer>
    </div>
  );
}
