import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";
import { adminNav } from "../config/adminNav";

export default function AdminLayout() {
  const { pathname } = useLocation();

  // Find the menu item that matches the current URL
  const current = adminNav.find((item) => item.path === pathname);
  const title = current ? current.label : "Admin";

  return (
    <div className="flex min-h-screen bg-cream-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar title={title} subtitle="Manage your store operations" />

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}