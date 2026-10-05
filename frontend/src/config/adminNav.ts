import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  ShieldCheck,
  Tags,
  Package,
} from "lucide-react";

export const adminNav = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Orders", path: "/admin/orders", icon: ShoppingCart },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Roles", path: "/admin/roles", icon: ShieldCheck },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Products", path: "/admin/products", icon: Package },
];