import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import { handleLogout } from "../../utils/logout";
import "../upper_management/Dashboard.css";
import "../../components/internal/Sidebar.css";

export default function OrderProcessorDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, meRes] = await Promise.all([
          apiFetch("/api/op/pending-orders/"),
          apiFetch("/api/me/"),
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

  useEffect(() => {
    if (orders.length === 0) return;

    const sorted = [...orders].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "order_id") {
        comparison = a.order_id - b.order_id;
      } else if (sortBy === "status") {
        comparison = a.order_status.localeCompare(b.order_status);
      } else if (sortBy === "date") {
        comparison = new Date(a.date_ordered) - new Date(b.date_ordered);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredOrders(sorted);
  }, [sortBy, sortDirection, orders]);

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
    if (sortBy === "date") return "Date Ordered";
    if (sortBy === "status") return "Status";
    if (sortBy === "order_id") return "Order ID";
  };

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredOrders, 10, [sortBy, sortDirection]);

  const onLogout = () => handleLogout(navigate);

  const sortOptions = [
    { value: "date", label: "Date Ordered" },
    { value: "status", label: "Status" },
    { value: "order_id", label: "Order ID" },
  ];

  return (
    <div className="um-dashboard-wrapper">
      {/* HEADER */}
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        {/* SIDEBAR */}
        <aside className="um-sidebar">
          <nav className="um-sidebar-nav">
            <div className="um-sidebar-item active">Dashboard</div>
            <div
              className="um-sidebar-item"
              onClick={() => navigate("/order-processor/history")}
            >
              Order History
            </div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">
            Hello, {userName || "Order Processor"}
          </h1>

          {/* Stat Card */}
          <div className="um-stats-container">
            <div className="um-stat-card">
              <span className="um-stat-label">For Processing</span>
              <span className="um-stat-number">
                {loading ? "..." : orders.length}
              </span>
            </div>
          </div>

          {/* Section Header with Sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Pending Orders:</h2>
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
                  fontWeight: "600",
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
                  zIndex: 1000,
                }}>
                  {sortOptions.map((option, index) => (
                    <div
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: index < sortOptions.length - 1 ? "1px solid #e0e0e0" : "none",
                        backgroundColor: sortBy === option.value ? "#f5f5f5" : "white",
                        fontWeight: sortBy === option.value ? "600" : "400",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: index === sortOptions.length - 1 ? "0 0 8px 8px" : "0",
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
          </div>

          {/* Sort indicator */}
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
              gap: "6px",
            }}>
              {getSortLabel()}
              <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
            </span>
          </div>

          {/* Orders List */}
          {loading ? (
            <p style={{ color: "#888", padding: "1rem" }}>Loading...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
          ) : (
            <div className="um-list-container">
              {paginatedData.map((order) => (
                <div
                  key={order.order_id}
                  className="um-request-item"
                  onClick={() => navigate(`/order-processor/order/${order.order_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="um-request-info">
                    <div className="um-request-id">ORDER ID {order.order_id}</div>
                    <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                </div>
              ))}
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
