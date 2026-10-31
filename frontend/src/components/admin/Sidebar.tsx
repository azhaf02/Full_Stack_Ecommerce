import { NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, LogOut } from "lucide-react";
import { adminNav } from "../../config/adminNav";
import { getSession, logout } from "../../services/authService";

// Sidebar sections. Links are matched by label; any link not listed here
// (for example a page another module adds later) appears under "More".
const SECTIONS: { title: string; labels: string[] }[] = [
  { title: "Overview", labels: ["Dashboard", "Analytics"] },
  { title: "Sales", labels: ["Orders", "Returns", "Payments"] },
  { title: "Catalog", labels: ["Products", "Categories", "Reviews"] },
  { title: "People", labels: ["Customers", "Roles"] },
];

type NavItem = (typeof adminNav)[number];

function groupNav(): { title: string; items: NavItem[] }[] {
  const listed = new Set(SECTIONS.flatMap((s) => s.labels));
  const groups = SECTIONS.map((s) => ({
    title: s.title,
    items: s.labels
      .map((label) => adminNav.find((item) => item.label === label))
      .filter((item): item is NavItem => Boolean(item)),
  }));
  const others = adminNav.filter((item) => !listed.has(item.label));
  if (others.length > 0) groups.push({ title: "More", items: others });
  return groups.filter((g) => g.items.length > 0);
}

export default function Sidebar() {
  const navigate = useNavigate();
  const session = getSession();
  const groups = groupNav();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="admin-sidebar w-64 h-screen sticky top-0 bg-primary-800 text-primary-100 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <span className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-inner">
          <ShoppingBag className="text-cream-100" size={20} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold tracking-[0.14em] text-white">VIORA</p>
          <p className="text-[11px] uppercase tracking-widest text-primary-300">Admin panel</p>
        </div>
      </div>

      {/* Nav links, grouped */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary-300/80">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? "bg-primary-700 text-white"
                          : "text-primary-100/90 hover:bg-primary-700/60 hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Small bar on the left of the active link */}
                        <span
                          className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cream-100 transition-opacity duration-150 ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <Icon
                          size={18}
                          className={`transition-transform duration-150 ${isActive ? "" : "group-hover:translate-x-0.5"}`}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card at bottom */}
      <div className="m-3 flex items-center gap-3 p-3 rounded-xl bg-primary-700/50">
        <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold ring-2 ring-primary-500">
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
          className="p-2 rounded-lg text-primary-200 transition-colors hover:bg-primary-700 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
