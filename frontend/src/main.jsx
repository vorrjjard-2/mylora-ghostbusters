import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/CustomerNavbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Shared pages (public or multi-role)
import Login from "./pages/shared/Login/Login";
import ApplyStep1 from "./pages/shared/apply/ApplyStep1";
import ApplyStep2 from "./pages/shared/apply/ApplyStep2";
import ActivateAccount from "./pages/shared/ActivateAccount";

// Customer pages
import CustomerLanding from "./pages/customer/CustomerLanding";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerAccount from "./pages/customer/CustomerAccount";
import CustomerDashboard from "./pages/customer/Dashboard.jsx";

// Upper Management pages
import UpperDashboard from "./pages/upper_management/Dashboard";
import EnrollmentReview from "./pages/upper_management/EnrollmentReview";

// Credit Manager pages
import CreditDashboard from "./pages/credit_manager/Dashboard";

// Order Processor pages
import OrderDashboard from "./pages/order_processor/Dashboard";




function Layout() {
  const location = useLocation();

  const hideNavbar = 
    location.pathname === "/login" || 
    location.pathname === "/signup" || 
    location.pathname.startsWith("/activate/") || 
    location.pathname.startsWith("/apply/") || 
    location.pathname.startsWith("/upper-management/") ||
    location.pathname.startsWith("/credit-manager/") ||
    location.pathname.startsWith("/order-processor/");
    
  return (
    <>
      {!hideNavbar && <Navbar />}

      <div className="app-container">
        <Routes>
          {/* 👇 default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Shared/Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/apply/step-1" element={<ApplyStep1 />} />
          <Route path="/apply/step-2" element={<ApplyStep2 />} />
          <Route path="/activate/:token" element={<ActivateAccount />} />
          
          {/* Upper Management routes */}
          <Route
            path="/upper-management/dashboard"
            element={
              <ProtectedRoute requiredRole="upper_management"> 
                <UpperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upper-management/enrollments/:applicationId"
            element={
              <ProtectedRoute requiredRole="upper_management">
                <EnrollmentReview />
              </ProtectedRoute>
            }
          />
          
          {/* Credit Manager routes */}
          <Route
            path="/credit-manager/dashboard"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CreditDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Order Processor routes */}
          <Route
            path="/order-processor/dashboard"
            element={
              <ProtectedRoute requiredRole="order_processor">
                <OrderDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Customer routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<CustomerLanding />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/account" element={<CustomerAccount />} />
          
          {/* Legacy routes - redirect to new structure */}
          <Route path="/internal/dashboard" element={<Navigate to="/upper-management/dashboard" replace />} />
          <Route path="/upper_m/enrollments/:applicationId" element={<Navigate to="/upper-management/enrollments/:applicationId" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);