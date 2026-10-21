import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, LogOut } from "lucide-react";
import { getSession, logout } from "../../services/authService";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const navigate = useNavigate();
  const session = getSession();

  const [query, setQuery] = useState("");
  // Which dropdown is open: the bell, the avatar menu, or none
  const [open, setOpen] = useState<"bell" | "user" | null>(null);
  const menusRef = useRef<HTMLDivElement>(null);

  // Close the open dropdown when the user clicks anywhere else or presses Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menusRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Enter in the search box opens the Orders page filtered by the text
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders");
    setQuery("");
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="flex justify-between items-center bg-cream-50 border-b px-8 py-4">
      {/* Left: title */}
      <div>
        <h1 className="text-xl font-bold text-primary-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Right: search, bell, avatar */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative" role="search">
          <Search className="absolute left-4 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders..."
            aria-label="Search orders"
            className="pl-10 pr-4 py-2 border rounded-full text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </form>

        <div ref={menusRef} className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setOpen(open === "bell" ? null : "bell")}
              className="relative p-2 rounded-full hover:bg-cream-200"
              aria-label="Notifications"
              aria-expanded={open === "bell"}
            >
              <Bell size={20} className="text-primary-700" />
            </button>
            {open === "bell" && (
              <div className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-lg z-20">
                <p className="px-4 py-3 border-b text-sm font-semibold text-slate-800">Notifications</p>
                <p className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications</p>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpen(open === "user" ? null : "user")}
              className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold hover:bg-primary-700"
              aria-label="Account menu"
              aria-expanded={open === "user"}
            >
              {session?.name.charAt(0) ?? "A"}
            </button>
            {open === "user" && (
              <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-20">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold text-slate-800 truncate">{session?.name ?? "Admin"}</p>
                  <p className="text-xs text-slate-500 truncate">{session?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-cream-100 rounded-b-xl"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
