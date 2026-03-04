import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "" });

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.username) setUser({ username: data.username }); })
      .catch(console.error);
  }, []);

  const [enrollments, setEnrollments] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("enrollments");

  // Sorting states
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sorted data
  const [sortedEnrollments, setSortedEnrollments] = useState([]);
  const [sortedOverrides, setSortedOverrides] = useState([]);
  const [sortedOrders, setSortedOrders] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/enrollments/pending/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load enrollments: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setEnrollments(data))
      .catch(err => {
        console.error("Failed to load enrollments", err);
      });

    fetch("http://localhost:8000/api/um/pending-overrides/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load overrides: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setOverrideRequests(data))
      .catch(err => {
        console.error("Failed to load override requests", err);
      });

    fetch("http://localhost:8000/api/um/pending-orders/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load pending orders: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setPendingOrders(data))
      .catch(err => {
        console.error("Failed to load pending orders", err);
      });
  }, []);

  // Sort data whenever dependencies change
  useEffect(() => {
    if (activeTab === "enrollments") {
      const sorted = [...enrollments].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "name") {
          comparison = (a.name || "").localeCompare(b.name || "");
        } else if (sortBy === "date") {
          comparison = new Date(a.date) - new Date(b.date);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedEnrollments(sorted);
    }

    if (activeTab === "overrides") {
      const sorted = [...overrideRequests].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "customer") {
          comparison = (a.customer_name || "").localeCompare(b.customer_name || "");
        } else if (sortBy === "date") {
          comparison = new Date(a.date_submitted) - new Date(b.date_submitted);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedOverrides(sorted);
    }

    if (activeTab === "orders") {
      const sorted = [...pendingOrders].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "customer") {
          comparison = (a.customer_name || "").localeCompare(b.customer_name || "");
        } else if (sortBy === "amount") {
          comparison = parseFloat(a.amount) - parseFloat(b.amount);
        } else if (sortBy === "status") {
          comparison = (a.status || "").localeCompare(b.status || "");
        } else if (sortBy === "date") {
          comparison = new Date(a.date_submitted) - new Date(b.date_submitted);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
      setSortedOrders(sorted);
    }
  }, [activeTab, enrollments, overrideRequests, pendingOrders, sortBy, sortDirection]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "date" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const getSortLabel = () => {
    if (activeTab === "enrollments") {
      if (sortBy === "date") return "Date Submitted";
      if (sortBy === "name") return "Name";
    } else if (activeTab === "overrides") {
      if (sortBy === "date") return "Date Submitted";
      if (sortBy === "order_id") return "Order ID";
      if (sortBy === "customer") return "Customer Name";
    } else if (activeTab === "orders") {
      if (sortBy === "date") return "Date Submitted";
      if (sortBy === "order_id") return "Order ID";
      if (sortBy === "customer") return "Customer Name";
      if (sortBy === "amount") return "Amount";
      if (sortBy === "status") return "Status";
    }
    return "Date";
  };

  const getSortOptions = () => {
    if (activeTab === "enrollments") {
      return [
        { value: "date", label: "Date Submitted" },
        { value: "name", label: "Name" },
      ];
    } else if (activeTab === "overrides") {
      return [
        { value: "date", label: "Date Submitted" },
        { value: "order_id", label: "Order ID" },
        { value: "customer", label: "Customer Name" },
      ];
    } else if (activeTab === "orders") {
      return [
        { value: "date", label: "Date Submitted" },
        { value: "order_id", label: "Order ID" },
        { value: "customer", label: "Customer Name" },
        { value: "amount", label: "Amount" },
        { value: "status", label: "Status" },
      ];
    }
    return [];
  };

  const renderSortDropdown = () => (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowSortMenu(!showSortMenu)}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          border: "1px solid #262626",
          borderRadius: "8px",
          backgroundColor: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: "600"
        }}
      >
        <span>↕</span>
        <span>Sort By: {getSortLabel()}</span>
        <span style={{ fontSize: "12px", color: "#666" }}>
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      </button>

      {showSortMenu && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 5px)",
          right: 0,
          backgroundColor: "white",
          border: "1px solid #262626",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          minWidth: "200px",
          zIndex: 1000
        }}>
          {getSortOptions().map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: index < getSortOptions().length - 1 ? "1px solid #e0e0e0" : "none",
                backgroundColor: sortBy === option.value ? "#f5f5f5" : "white",
                fontWeight: sortBy === option.value ? "600" : "400",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: index === getSortOptions().length - 1 ? "0 0 8px 8px" : "0"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === option.value ? "#f5f5f5" : "white"}
            >
              <span>{option.label}</span>
              {sortBy === option.value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSortIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "14px", color: "#666" }}>Sorted by:</span>
      <span style={{
        padding: "6px 12px",
        backgroundColor: "#1E2D1A",
        color: "white",
        borderRadius: "20px",
        fontSize: "14px",
        fontWeight: "600",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px"
      }}>
        {getSortLabel()}
        <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
      </span>
    </div>
  );

 return (
    <div className="um-dashboard-wrapper">
        {/* HEADER */}
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
          <div className="um-header-actions">
            <button className="um-logout-btn" onClick={() => navigate("/login")}>
              Logout
            </button>
          </div>
        </header>

        <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
            <Sidebar />

          <main className="um-dashboard-content">
            {/* SECTION 2: WELCOME BANNER */}
            <h1 className="um-welcome-text">Hello, {user.username}</h1>

            {/* SECTION 3: STAT CARDS */}
            <div className="um-stats-container">
              <div className="um-stat-card">
                <span className="um-stat-label">Enrollment Requests</span>
                <span className="um-stat-number">{enrollments.length}</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Credit Override</span>
                <span className="um-stat-number">{overrideRequests.length}</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Order Processing</span>
                <span className="um-stat-number">{pendingOrders.length}</span>
              </div>
            </div>

            {/* SECTION 4: TABS */}
            <div className="um-tabs-row">
              <button 
                className={`um-tab ${activeTab === "enrollments" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("enrollments")}
              >
                Enrollment Requests
              </button>
              <button 
                className={`um-tab ${activeTab === "overrides" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("overrides")}
              >
                Credit Override
              </button>
              <button 
                className={`um-tab ${activeTab === "orders" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Order Processing
              </button>
            </div>

            {/* SECTION 5: SORT + LIST */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              {renderSortIndicator()}
              {renderSortDropdown()}
            </div>

            <div className="um-list-container">
              {activeTab === "enrollments" && (
                <>
                  {sortedEnrollments.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending enrollment requests.</p>}
                  {sortedEnrollments.map((e) => (
                    <div key={e.application_id} className="um-request-item">
                      <div className="um-request-info">
                        <Link to={`/upper-management/enrollments/${e.application_id}`} className="um-request-id">
                          {e.application_id.slice(0, 8).toUpperCase()}
                        </Link>
                        <div className="um-request-sub">Submitted by: {e.name}</div>
                      </div>
                      <div className="um-request-date">Date Submitted: {e.date}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "overrides" && (
                <>
                  {sortedOverrides.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending override requests.</p>}
                  {sortedOverrides.map((override) => (
                    <div
                      key={override.override_id}
                      className="um-request-item"
                      onClick={() => navigate(`/upper-management/override/${override.override_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="um-request-info">
                        <div className="um-request-id">ORDER ID {override.order_id}</div>
                        <div className="um-request-sub">Customer: {override.customer_name}</div>
                      </div>
                      <div className="um-request-date">Date Submitted: {override.date_submitted}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "orders" && (
                <>
                  {sortedOrders.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>}
                  {sortedOrders.map((order) => (
                    <div
                      key={order.order_id}
                      className="um-request-item"
                      onClick={() => navigate(`/upper-management/customer/${order.customer_id}/order/${order.order_id}`, { state: { from: "/upper-management/dashboard" } })}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="um-request-info">
                        <div className="um-request-id">ORDER ID {order.order_id}</div>
                        <div className="um-request-sub">Customer: {order.customer_name} | Amount: ₱{parseFloat(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="um-request-date">
                        Status: {order.status === "PENDING" ? "Pending Credit Approval" : "Pending Processing"} | {order.date_submitted}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </main>
      </div>
    </div>
  ); 
}