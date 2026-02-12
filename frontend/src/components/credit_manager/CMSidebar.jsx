import { useLocation } from "react-router-dom";
import "../internal/Sidebar.css";

export default function CMSidebar({ activeTab, setActiveTab }) {
  const location = useLocation();
  const isOnDashboard = location.pathname === "/credit-manager/dashboard";

  const handleClick = (tab) => {
    if (isOnDashboard && setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <aside className="um-sidebar">
      <nav className="um-sidebar-nav">
        <MenuItem 
          active={isOnDashboard && !activeTab} 
          onClick={() => handleClick(null)}
        >
          Dashboard
        </MenuItem>
        <MenuItem 
          active={isOnDashboard && activeTab === "credit"} 
          onClick={() => handleClick("credit")}
        >
          Credit Approval
        </MenuItem>
        <MenuItem 
          active={isOnDashboard && activeTab === "payment"} 
          onClick={() => handleClick("payment")}
        >
          Payment Review
        </MenuItem>
        <MenuItem 
          active={isOnDashboard && activeTab === "adjustment"} 
          onClick={() => handleClick("adjustment")}
        >
          Credit Adjustment
        </MenuItem>
      </nav>
    </aside>
  );
}

function MenuItem({ children, active, onClick }) {
  return (
    <div 
      className={`um-sidebar-item ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {children}
    </div>
  );
}