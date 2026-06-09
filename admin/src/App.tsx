import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

const Loading = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<Loading />}>
          <LoginPage />
        </Suspense>
      } />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={
          <Suspense fallback={<Loading />}>
            <DashboardPage />
          </Suspense>
        } />
        <Route path="products" element={
          <Suspense fallback={<Loading />}>
            <ProductsPage />
          </Suspense>
        } />
        <Route path="orders" element={
          <Suspense fallback={<Loading />}>
            <OrdersPage />
          </Suspense>
        } />
        <Route path="payments" element={
          <Suspense fallback={<Loading />}>
            <PaymentsPage />
          </Suspense>
        } />
        <Route path="inventory" element={
          <Suspense fallback={<Loading />}>
            <InventoryPage />
          </Suspense>
        } />
        <Route path="recruitment" element={
          <Suspense fallback={<Loading />}>
            <RecruitmentPage />
          </Suspense>
        } />
        <Route path="content" element={
          <Suspense fallback={<Loading />}>
            <ContentPage />
          </Suspense>
        } />
        <Route path="users" element={
          <Suspense fallback={<Loading />}>
            <UsersPage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<Loading />}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="notifications" element={
          <Suspense fallback={<Loading />}>
            <NotificationsPage />
          </Suspense>
        } />
        <Route path="analytics" element={
          <Suspense fallback={<Loading />}>
            <AnalyticsPage />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}

export default App;
