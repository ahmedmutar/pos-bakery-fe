import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './i18n'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import SmartRedirect from './components/SmartRedirect'
import PlanGate from './components/ui/PlanGate'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CashierPage from './pages/CashierPage'
import ProductsPage from './pages/ProductsPage'
import InventoryPage from './pages/InventoryPage'
import RecipesPage from './pages/RecipesPage'
import ProductionPage from './pages/ProductionPage'
import OrdersPage from './pages/OrdersPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import AdminPanelPage from './pages/admin/AdminPanelPage'
import LandingPage from './pages/LandingPage'
import UpgradePage from './pages/UpgradePage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import BillingPage from './pages/BillingPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import FAQPage from './pages/FAQPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import StockOpnamePage from './pages/StockOpnamePage'
import RegisterPage from './pages/RegisterPage'
import ForecastPage from './pages/ForecastPage'
import ExpensesPage from './pages/ExpensesPage'
import VouchersPage from './pages/VouchersPage'
import CustomersPage from './pages/CustomersPage'
import BroadcastPage from './pages/BroadcastPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import ResellersPage from './pages/ResellersPage'
import PublicOrderPage from './pages/PublicOrderPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 },
  },
})

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public order page — no auth required */}
            <Route path="/order/:slug" element={<PublicOrderPage />} />

            {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/payment/failed" element={<PaymentFailedPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin panel — separate from main app */}
            <Route path="/admin" element={<AdminPanelPage />} />

            {/* Main app */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<SmartRedirect />} />

              {/* All roles — no plan gate */}
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="orders"    element={<OrdersPage />} />
              <Route path="settings"  element={<SettingsPage />} />
              <Route path="upgrade"   element={<UpgradePage />} />
              <Route path="billing"   element={<BillingPage />} />

              {/* OWNER + CASHIER */}
              <Route path="cashier" element={
                <RoleGuard allow={['OWNER', 'CASHIER']}><CashierPage /></RoleGuard>
              } />
              <Route path="reports" element={
                <RoleGuard allow={['OWNER', 'CASHIER']}><ReportsPage /></RoleGuard>
              } />

              {/* ── PRO FEATURES ───────────────────────────────────── */}
              <Route path="inventory" element={
                <RoleGuard allow={['OWNER', 'PRODUCTION']}>
                  <PlanGate feature="hasInventory" featureName="Inventori & Bahan Baku">
                    <InventoryPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="stock-opname" element={
                <PlanGate feature="hasExcelImport" featureName="Stock Opname">
                  <StockOpnamePage />
                </PlanGate>
              } />
              <Route path="recipes" element={
                <RoleGuard allow={['OWNER', 'PRODUCTION']}>
                  <PlanGate feature="hasRecipes" featureName="Resep & Food Cost">
                    <RecipesPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="production" element={
                <RoleGuard allow={['OWNER', 'PRODUCTION']}>
                  <PlanGate feature="hasProduction" featureName="Manajemen Produksi">
                    <ProductionPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="forecast" element={
                <RoleGuard allow={['OWNER', 'PRODUCTION']}>
                  <PlanGate feature="hasForecast" featureName="Forecast Produksi">
                    <ForecastPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="expenses" element={
                <RoleGuard allow={['OWNER']}>
                  <PlanGate feature="hasExpenses" featureName="Pencatatan Pengeluaran">
                    <ExpensesPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="vouchers" element={
                <RoleGuard allow={['OWNER']}><VouchersPage /></RoleGuard>
              } />
              <Route path="customers" element={
                <RoleGuard allow={['OWNER', 'CASHIER']}>
                  <PlanGate feature="hasCustomers" featureName="Manajemen Pelanggan">
                    <CustomersPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="broadcast" element={
                <RoleGuard allow={['OWNER']}>
                  <PlanGate feature="hasBroadcast" featureName="WA Broadcast">
                    <BroadcastPage />
                  </PlanGate>
                </RoleGuard>
              } />
              <Route path="purchase-orders" element={
                <RoleGuard allow={['OWNER']}>
                  <PlanGate feature="hasPurchaseOrders" featureName="Purchase Order">
                    <PurchaseOrdersPage />
                  </PlanGate>
                </RoleGuard>
              } />

              {/* OWNER + PRODUCTION — no plan gate */}
              <Route path="products" element={
                <RoleGuard allow={['OWNER', 'PRODUCTION']}><ProductsPage /></RoleGuard>
              } />

              {/* ── ENTERPRISE FEATURES ────────────────────────────── */}
              <Route path="resellers" element={
                <RoleGuard allow={['OWNER']}>
                  <PlanGate feature="hasResellers" featureName="Manajemen Reseller & Agen">
                    <ResellersPage />
                  </PlanGate>
                </RoleGuard>
              } />

              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
