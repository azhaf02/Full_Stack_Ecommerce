import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, LogOut } from "lucide-react";
import { adminNav } from "../../config/adminNav";
import { getSession, logout } from "../../services/authService";

export default function Sidebar() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-primary-800 text-primary-100 flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 text-xl font-bold text-white mb-8 px-2">
        <span className="p-2 rounded-lg bg-primary-600">
          <ShoppingBag className="text-cream-100" size={22} />
        </span>
        Viora
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
        {adminNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-primary-100 hover:bg-primary-700 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className="mt-auto flex items-center gap-3 p-3 border-t border-primary-700">
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
          {session?.name.charAt(0) ?? "A"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{session?.name ?? "Admin"}</p>
          <p className="text-xs text-primary-200">Admin</p>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          title="Log out"
          className="p-2 rounded-lg text-primary-200 hover:bg-primary-700 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}