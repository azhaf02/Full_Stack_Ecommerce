import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  Tags,
  BarChart3,
  Package,
} from "lucide-react";

export const adminNav = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Roles", path: "/admin/roles", icon: ShieldCheck },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Inventory", path: "/admin/inventory", icon: Package },
];