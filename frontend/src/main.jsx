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
import CustomerLanding from "./pages/CustomerLanding";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerAccount from "./pages/CustomerAccount";
import Login from "./pages/Login/Login";
import ApplyStep1 from "./pages/apply/ApplyStep1";
import ApplyStep2 from "./pages/apply/ApplyStep2";

import UpperDashboard from "./pages/upper_m/Dashboard";
import EnrollmentReview from "./pages/upper_m/EnrollmentReview";




function Layout() {
  const location = useLocation();

  const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div style={{ padding: "2rem" }}>
        <Routes>
          {/* 👇 default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/apply/step-1" element={<ApplyStep1 />} />
          <Route path="/apply/step-2" element={<ApplyStep2 />} />
          
          {/* Protected internal routes */}
          <Route
            path="/internal/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <UpperDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upper_m/enrollments/:applicationId"
            element={
              <ProtectedRoute requiredRole="admin">
                <EnrollmentReview />
              </ProtectedRoute>
            }
          />
          
          {/* Customer routes - can also be protected if needed */}
          <Route path="/home" element={<CustomerLanding />} />
          <Route path="/orders" element={<CustomerOrders />} />
          <Route path="/account" element={<CustomerAccount />} />
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