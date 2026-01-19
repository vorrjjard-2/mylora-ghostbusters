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
import CustomerLanding from "./pages/CustomerLanding";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerAccount from "./pages/CustomerAccount";
import Login from "./pages/Login";

function Layout() {
  const location = useLocation();

  const hideNavbar = location.pathname === "/login";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div style={{ padding: "2rem" }}>
        <Routes>
          {/* 👇 default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
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
