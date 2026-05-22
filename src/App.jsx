import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

/* ── Lazy-loaded pages ────────────────────────────────────────────── */
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceForm = lazy(() => import('./pages/InvoiceForm'));
const Estimates = lazy(() => import('./pages/Estimates'));
const EstimateForm = lazy(() => import('./pages/EstimateForm'));
const Bills = lazy(() => import('./pages/Bills'));
const BillForm = lazy(() => import('./pages/BillForm'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Products = lazy(() => import('./pages/Products'));
const BankAccounts = lazy(() => import('./pages/BankAccounts'));
const BankTransactions = lazy(() => import('./pages/BankTransactions'));
const Payments = lazy(() => import('./pages/Payments'));
const VATReturns = lazy(() => import('./pages/VATReturns'));
const Reports = lazy(() => import('./pages/Reports'));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Engineers = lazy(() => import('./pages/Engineers'));
const Company = lazy(() => import('./pages/Company'));
const Team = lazy(() => import('./pages/Team'));

/* ── Loading fallback ─────────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader__spinner" />
      <p>Loading...</p>
    </div>
  );
}

/* ── App ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Invoices */}
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceForm />} />
          <Route path="invoices/:id" element={<InvoiceForm />} />

          {/* Estimates */}
          <Route path="estimates" element={<Estimates />} />
          <Route path="estimates/new" element={<EstimateForm />} />
          <Route path="estimates/:id" element={<EstimateForm />} />

          {/* Bills */}
          <Route path="bills" element={<Bills />} />
          <Route path="bills/new" element={<BillForm />} />
          <Route path="bills/:id" element={<BillForm />} />

          {/* Contacts */}
          <Route path="customers" element={<Customers />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="products" element={<Products />} />

          {/* Banking */}
          <Route path="bank-accounts" element={<BankAccounts />} />
          <Route path="bank-transactions" element={<BankTransactions />} />
          <Route path="payments" element={<Payments />} />

          {/* Tax */}
          <Route path="vat" element={<VATReturns />} />
          <Route path="reports" element={<Reports />} />
          <Route path="chart-of-accounts" element={<ChartOfAccounts />} />

          {/* Calendar */}
          <Route path="calendar" element={<Calendar />} />
          <Route path="engineers" element={<Engineers />} />

          {/* Settings */}
          <Route path="company" element={<Company />} />
          <Route path="team" element={<Team />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
