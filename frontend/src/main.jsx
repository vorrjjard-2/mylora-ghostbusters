import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

// Shared pages (public or multi-role)
import Login from "./pages/shared/Login/Login";
import ApplyStep1 from "./pages/shared/apply/ApplyStep1";
import ApplyStep2 from "./pages/shared/apply/ApplyStep2";
import ActivateAccount from "./pages/shared/ActivateAccount";

// Customer pages
import CustomerLanding from "./pages/customer/CustomerLanding";
import CustomerOrders from "./pages/customer/CustomerOrders";
import CustomerProfile from "./pages/customer/CustomerProfile";
import CustomerDashboard from "./pages/customer/Dashboard";
import CreateOrder from "./pages/customer/CreateOrder";
import DeliveryDetails from "./pages/customer/DeliveryDetails";
import ReviewOrder from "./pages/customer/ReviewOrder";
import OrderSuccess from "./pages/customer/OrderSuccess";
import OrderHistory from "./pages/customer/OrderHistory";
import OrderDetail from "./pages/customer/OrderDetail";
import PaymentRequest from "./pages/customer/PaymentRequest";
import PaymentSuccess from "./pages/customer/PaymentSuccess";

// Upper Management pages
import UpperDashboard from "./pages/upper_management/Dashboard";
import EnrollmentReview from "./pages/upper_management/EnrollmentReview";
import OverrideReview from "./pages/upper_management/OverrideReview";

// Credit Manager pages
import CreditDashboard from "./pages/credit_manager/Dashboard";
import PaymentReview from "./pages/credit_manager/PaymentReview";
import CreditApproval from "./pages/credit_manager/CreditApproval";
import CreditApprovalSuccess from "./pages/credit_manager/CreditApprovalSuccess";
import CreditAdjustment from "./pages/credit_manager/CreditAdjustment";
import UpdateBalance from "./pages/credit_manager/UpdateBalance";
import CustomerHistory from "./pages/credit_manager/CustomerHistory";
import CustomerDetails from "./pages/credit_manager/CustomerDetails";

// Order Processor pages
import OrderDashboard from "./pages/order_processor/Dashboard";




function Layout() {
  const location = useLocation();

  return (
    <>
      <div style={{ padding: "2rem", backgroundColor: "#FCFCFC" }}>
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
          <Route
            path="/upper-management/override/:overrideId"
            element={
              <ProtectedRoute requiredRole="upper_management">
                <OverrideReview />
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
          <Route
            path="/credit-manager/adjustment"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CreditAdjustment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/customer/:customerId/details"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CustomerDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/customer/:customerId/update-balance"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <UpdateBalance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/customer/:customerId/history"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CustomerHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/approve/:orderId"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CreditApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/approve/:orderId/success"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <CreditApprovalSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-manager/payment/:paymentId"
            element={
              <ProtectedRoute requiredRole="credit_manager">
                <PaymentReview />
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
          <Route
            path="/orders/create"
            element={
               <ProtectedRoute> 
                <CreateOrder />
               </ProtectedRoute> 
            }
          />
          <Route
            path="/orders/delivery"
            element={
              <ProtectedRoute>
                <DeliveryDetails/>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/review"
            element={
               <ProtectedRoute>
                <ReviewOrder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/success"
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit/update"
            element={
              <ProtectedRoute>
                <PaymentRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route path="/home" element={<CustomerLanding />} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/account" element={<CustomerProfile />} />
          
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