import { Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

// Global styles for every page except the admin panel (which has its own admin.css).
// Loaded through this layout instead of main.tsx so Bootstrap does not restyle /admin.
export default function StorefrontLayout() {
  return <Outlet />;
}
