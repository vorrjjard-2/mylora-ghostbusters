import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import apiFetch from "../../utils/apiFetch";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  const [hasPendingCreditChanges, setHasPendingCreditChanges] = useState(false);

  useEffect(() => {
    apiFetch("/api/um/credit-increases/")
      .then((res) => res.json())
      .then((data) => {
        const pending = data.filter((r) => r.status === "PENDING");
        setHasPendingCreditChanges(pending.length > 0);
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="um-sidebar">
      <nav className="um-sidebar-nav">
        <MenuItem to="/upper-management/dashboard" active={location.pathname === "/upper-management/dashboard"}>Dashboard</MenuItem>
        <MenuItem to="/upper-management/all-orders" active={location.pathname === "/upper-management/all-orders"}>All Orders</MenuItem>
        <MenuItem to="/upper-management/payment-requests" active={location.pathname === "/upper-management/payment-requests"}>Payment Requests</MenuItem>
        <MenuItem to="/upper-management/credit-changes" active={location.pathname === "/upper-management/credit-changes"} showDot={hasPendingCreditChanges}>Credit Changes</MenuItem>
        <MenuItem to="/upper-management/all-products" active={location.pathname === "/upper-management/all-products"}>All Products</MenuItem>
        <MenuItem to="/upper-management/customers" active={location.pathname.includes("/upper-management/customer")}>Customer Database</MenuItem>
        <MenuItem to="/upper-management/employees" active={location.pathname.includes("/upper-management/employee")}>Employee Database</MenuItem>
        <MenuItem to="/upper-management/audit-log" active={location.pathname === "/upper-management/audit-log"}>Audit Log</MenuItem>
        <MenuItem to="/upper-management/set-messages" active={location.pathname === "/upper-management/set-messages"}>Set Messages</MenuItem>
      </nav>
    </aside>
  );
}

function MenuItem({ children, active, to, showDot }) {
  const content = (
    <div className={`um-sidebar-item ${active ? "active" : ""}`}>
      {children}
      {showDot && (
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          backgroundColor: "#dc3545", display: "inline-block", marginLeft: "8px",
          flexShrink: 0,
        }} />
      )}
    </div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }

  return content;
}