import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import { getCookie } from "../../utils/csrf";
import "./Dashboard.css";

export default function OrderProcessorDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date"); // "date", "status", "order_id"
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" or "desc"
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, meRes] = await Promise.all([
          fetch("http://localhost:8000/api/op/pending-orders/", { credentials: "include" }),
          fetch("http://localhost:8000/api/me/", { credentials: "include" }),
        ]);
        if (!ordersRes.ok) throw new Error("Failed to load orders");
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        if (meRes.ok) {
          const me = await meRes.json();
          setUserName(me.username || "");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sort orders whenever sortBy or sortDirection changes
  useEffect(() => {
    if (orders.length === 0) return;

    const sorted = [...orders].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "order_id") {
        comparison = a.order_id - b.order_id;
      } else if (sortBy === "status") {
        comparison = a.order_status.localeCompare(b.order_status);
      } else if (sortBy === "date") {
        // Parse dates for comparison
        const dateA = new Date(a.date_ordered);
        const dateB = new Date(b.date_ordered);
        comparison = dateA - dateB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredOrders(sorted);
  }, [sortBy, sortDirection, orders]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "date" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const getSortLabel = () => {
    if (sortBy === "date") return "Date Ordered";
    if (sortBy === "status") return "Status";
    if (sortBy === "order_id") return "Order ID";
  };

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
    navigate("/login");
  };

  return (
    <div className="op-dash-root">
      {/* HEADER */}
      <header className="op-dash-header">
        <div className="op-dash-brand">
          <img src={logo} alt="Logo" className="op-dash-logo" />
          <span className="op-dash-brand-name">Web Credit System</span>
        </div>
        <button className="op-dash-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="op-dash-body">
        {/* SIDEBAR */}
        <aside className="op-dash-sidebar">
          <div className="op-dash-side-item op-dash-side-active">Dashboard</div>
          <div
            className="op-dash-side-item"
            onClick={() => navigate("/order-processor/history")}
          >
            Order History
          </div>
        </aside>

        {/* MAIN */}
        <main className="op-dash-main">
          <h1 className="op-dash-greeting">
            Hello, {userName || "Order Processor"}
          </h1>

          {/* Summary Card */}
          <div className="op-dash-card-row">
            <div className="op-dash-card">
              <div className="op-dash-card-label">For Processing</div>
              <div className="op-dash-card-count">
                {loading ? "..." : orders.length}
              </div>
            </div>
          </div>

          {/* Section Header with Sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 className="op-dash-section-title">Pending Orders:</h2>
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
                  <div
                    onClick={() => handleSortChange("date")}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: sortBy === "date" ? "#f5f5f5" : "white",
                      fontWeight: sortBy === "date" ? "600" : "400",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === "date" ? "#f5f5f5" : "white"}
                  >
                    <span>Date Ordered</span>
                    {sortBy === "date" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                  <div
                    onClick={() => handleSortChange("status")}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: sortBy === "status" ? "#f5f5f5" : "white",
                      fontWeight: sortBy === "status" ? "600" : "400",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === "status" ? "#f5f5f5" : "white"}
                  >
                    <span>Status</span>
                    {sortBy === "status" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                  <div
                    onClick={() => handleSortChange("order_id")}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      backgroundColor: sortBy === "order_id" ? "#f5f5f5" : "white",
                      fontWeight: sortBy === "order_id" ? "600" : "400",
                      borderRadius: "0 0 8px 8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === "order_id" ? "#f5f5f5" : "white"}
                  >
                    <span>Order ID</span>
                    {sortBy === "order_id" && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sorting indicator chip */}
          <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
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

          {loading ? (
            <div className="op-dash-empty">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="op-dash-empty">No pending orders.</div>
          ) : (
            <div className="op-dash-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="op-dash-list-item"
                  onClick={() => navigate(`/order-processor/order/${order.order_id}`)}
                >
                  <div className="op-dash-item-left">
                    <div className="op-dash-order-id">ORDER ID XX{order.order_id}</div>
                    <div className="op-dash-order-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="op-dash-item-right">
                    <span className="op-dash-badge">{order.order_status}</span>
                    <div className="op-dash-order-date">
                      Date Ordered: {order.date_ordered}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}