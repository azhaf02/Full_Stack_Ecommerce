import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { getSession, logout } from "../../services/authService";

interface TopbarProps {
  title: string;
  subtitle: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const navigate = useNavigate();
  const session = getSession();

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

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex justify-between items-center bg-cream-50/85 backdrop-blur border-b px-6 lg:px-8 py-4">
      {/* Left: title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary-900">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {/* Right: bell, avatar */}
      <div className="flex items-center gap-4">
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
