import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import { Route, Routes } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import { orderRoutes } from './routes/orderRoutes';

export default function CustomerApp() {
  return (
    <Routes>
      {orderRoutes}
      <Route path="*" element={<DashboardLayout />} />
    </Routes>
  );
}
