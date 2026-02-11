import { Link } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  /*
  return (
    <aside
      style={{
        width: 220,
        padding: "1.5rem",
        background: "#f2f2f2",
        minHeight: "100vh",
      }}
    >
      <nav>
        <MenuItem active>Dashboard</MenuItem>
        <MenuItem>New Account Requests</MenuItem>
        <MenuItem>All Orders</MenuItem>
        <MenuItem>Customer Database</MenuItem>
        <MenuItem>Employee Database</MenuItem>
        <MenuItem>Audit Log</MenuItem>
      </nav>
    </aside>
  );
}

function MenuItem({ children, active }) {
  return (
    <div
      style={{
        padding: "0.75rem 1rem",
        borderRadius: 6,
        marginBottom: 6,
        background: active ? "#d9dfd1" : "transparent",
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
  */

  return (
    <aside className="um-sidebar">
      <nav className="um-sidebar-nav">
        <MenuItem to="/upper-management/dashboard" active>Dashboard</MenuItem>
        <MenuItem>New Account Requests</MenuItem>
        <MenuItem>All Orders</MenuItem>
        <MenuItem to="/upper-management/customers">Customer Database</MenuItem>
        <MenuItem>Employee Database</MenuItem>
        <MenuItem>Audit Log</MenuItem>
      </nav>
    </aside>
  );
}

function MenuItem({ children, active, to }) {
  const content = (
    <div className={`um-sidebar-item ${active ? "active" : ""}`}>
      {children}
    </div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>{content}</Link>;
  }

  return content;
}