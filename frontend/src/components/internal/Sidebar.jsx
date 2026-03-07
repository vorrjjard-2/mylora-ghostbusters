import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="um-sidebar">
      <nav className="um-sidebar-nav">
        <MenuItem to="/upper-management/dashboard" active={location.pathname === "/upper-management/dashboard"}>Dashboard</MenuItem>
        <MenuItem to="/upper-management/all-orders" active={location.pathname === "/upper-management/all-orders"}>All Orders</MenuItem>
        <MenuItem to="/upper-management/customers" active={location.pathname.includes("/upper-management/customer")}>Customer Database</MenuItem>
        <MenuItem to="/upper-management/employees" active={location.pathname.includes("/upper-management/employee")}>Employee Database</MenuItem>
        <MenuItem to="/upper-management/audit-log" active={location.pathname === "/upper-management/audit-log"}>Audit Log</MenuItem>
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