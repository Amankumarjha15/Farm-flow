import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { fetchMe } from './features/auth/authSlice';

import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import VerifyEmail from './pages/public/VerifyEmail';
import { NotFound, Unauthorized } from './pages/public/StatusPages';

import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Profile from './pages/Profile';

import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProduceList from './pages/farmer/FarmerProduceList';
import FarmerProduceForm from './pages/farmer/FarmerProduceForm';
import FarmerBids from './pages/farmer/FarmerBids';
import FarmerOrders from './pages/farmer/FarmerOrders';
import FarmerPayouts from './pages/farmer/FarmerPayouts';

import RetailerMarketplace from './pages/retailer/RetailerMarketplace';
import ProduceDetail from './pages/retailer/ProduceDetail';
import Cart from './pages/retailer/Cart';
import RetailerBids from './pages/retailer/RetailerBids';
import { RetailerOrdersList, RetailerOrderDetail } from './pages/retailer/RetailerOrders';
import RetailerWishlist from './pages/retailer/RetailerWishlist';
import { RetailerDisputesList, RaiseDispute } from './pages/retailer/RetailerDisputes';

import LogisticsAvailable from './pages/logistics/LogisticsAvailable';
import LogisticsAssigned from './pages/logistics/LogisticsAssigned';
import LogisticsHistory from './pages/logistics/LogisticsHistory';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminProduce from './pages/admin/AdminProduce';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPayments from './pages/admin/AdminPayments';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminSettings from './pages/admin/AdminSettings';

function AppRoutes() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Farmer */}
      <Route element={<ProtectedRoute allowedRoles={['farmer']} />}>
        <Route path="/farmer" element={<DashboardLayout />}>
          <Route index element={<FarmerDashboard />} />
          <Route path="produce" element={<FarmerProduceList />} />
          <Route path="produce/new" element={<FarmerProduceForm />} />
          <Route path="produce/:id/edit" element={<FarmerProduceForm />} />
          <Route path="bids" element={<FarmerBids />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="payouts" element={<FarmerPayouts />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Retailer */}
      <Route element={<ProtectedRoute allowedRoles={['retailer']} />}>
        <Route path="/retailer" element={<DashboardLayout />}>
          <Route index element={<RetailerMarketplace />} />
          <Route path="produce/:id" element={<ProduceDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="bids" element={<RetailerBids />} />
          <Route path="orders" element={<RetailerOrdersList />} />
          <Route path="orders/:id" element={<RetailerOrderDetail />} />
          <Route path="wishlist" element={<RetailerWishlist />} />
          <Route path="disputes" element={<RetailerDisputesList />} />
          <Route path="disputes/new" element={<RaiseDispute />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Logistics */}
      <Route element={<ProtectedRoute allowedRoles={['logistics']} />}>
        <Route path="/logistics" element={<DashboardLayout />}>
          <Route index element={<LogisticsAvailable />} />
          <Route path="assigned" element={<LogisticsAssigned />} />
          <Route path="history" element={<LogisticsHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="farmers" element={<AdminUserManagement role="farmer" title="Farmers" />} />
          <Route path="retailers" element={<AdminUserManagement role="retailer" title="Retailers" />} />
          <Route path="logistics" element={<AdminUserManagement role="logistics" title="Logistics Partners" />} />
          <Route path="produce" element={<AdminProduce />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' } }} />
      <AppRoutes />
    </BrowserRouter>
  );
}
