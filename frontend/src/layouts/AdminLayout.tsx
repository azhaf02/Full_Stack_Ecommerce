import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { adminNav } from "../config/adminNav";

export default function AdminLayout() {
  const { pathname } = useLocation();

  // Find the menu item for the current URL. Sub-pages such as /admin/orders/12
  // use their section's title ("Orders"); the longest matching path wins.
  const current = [...adminNav]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path + "/")));
  const title = current ? current.label : "Admin";

  return (
    <div className="flex min-h-screen bg-cream-100">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar title={title} subtitle="Manage your store operations" />

        {/* key={pathname} replays the fade-in each time the page changes */}
        <main key={pathname} className="p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
