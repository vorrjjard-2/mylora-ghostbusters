import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import { handleLogout } from "../../utils/logout";
import "../upper_management/Dashboard.css";
import "../../components/internal/Sidebar.css";

const STATUS_STYLES = {
  APPROVED:  { backgroundColor: "#D1E7DD", color: "#0F5132" },
  COMPLETED: { backgroundColor: "#CCE5FF", color: "#004085" },
  PENDING:   { backgroundColor: "#FFF3CD", color: "#856404" },
  REJECTED:  { backgroundColor: "#F8D7DA", color: "#842029" },
};

function fmt(n) {
  return parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProcessorOrderHistory() {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [pendingRes, completedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/op/pending-orders/`, { credentials: "include" }),
          fetch(`${API_BASE_URL}/api/op/completed-orders/`, { credentials: "include" }),
        ]);
        if (!pendingRes.ok || !completedRes.ok) throw new Error("Failed to load orders");
        const [pending, completed] = await Promise.all([pendingRes.json(), completedRes.json()]);
        setPendingOrders(pending);
        setCompletedOrders(completed);
      } catch (err) {
        console.error(err);
        alert("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchBoth();
  }, []);

  useEffect(() => {
    const source = activeTab === "pending" ? pendingOrders : [...pendingOrders, ...completedOrders];

    const term = searchTerm.toLowerCase();
    let filtered = source.filter((o) =>
      (o.customer_name || "").toLowerCase().includes(term) ||
      String(o.order_id).includes(term)
    );

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "order_id") {
        comparison = a.order_id - b.order_id;
      } else if (sortBy === "status") {
        comparison = (a.order_status || "").localeCompare(b.order_status || "");
      } else if (sortBy === "date") {
        comparison = new Date(a.date_ordered) - new Date(b.date_ordered);
      } else if (sortBy === "amount") {
        comparison = parseFloat(a.total_amount || 0) - parseFloat(b.total_amount || 0);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredOrders(sorted);
  }, [activeTab, pendingOrders, completedOrders, searchTerm, sortBy, sortDirection]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "date" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: "date", label: "Date Ordered" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
    { value: "order_id", label: "Order ID" },
  ];

  const getSortLabel = () => sortOptions.find((o) => o.value === sortBy)?.label ?? "Date Ordered";

  const onLogout = () => handleLogout(navigate);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSortBy("date");
    setSortDirection("desc");
  };

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredOrders, 10, [searchTerm, activeTab, sortBy, sortDirection]);

  const handleOrderClick = (order) => {
    if (order.order_status === "COMPLETED") {
      navigate(`/order-processor/order/${order.order_id}/view`);
    } else {
      navigate(`/order-processor/order/${order.order_id}`);
    }
  };

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
            <div
              className="um-sidebar-item"
              onClick={() => navigate("/order-processor/dashboard")}
            >
              Dashboard
            </div>
            <div className="um-sidebar-item active">Order History</div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">Order History</h1>

          {/* TABS */}
          <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
            {[
              { key: "pending", label: "Pending" },
              { key: "all", label: "All Orders" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: activeTab === tab.key ? "#1f3d1a" : "#888",
                  borderBottom: activeTab === tab.key ? "3px solid #1f3d1a" : "none",
                  marginBottom: "-2px",
                  paddingBottom: "10px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SEARCH + SORT */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
              <input
                type="text"
                placeholder="Search by order ID or customer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 45px",
                  fontSize: "16px",
                  border: "1px solid #262626",
                  borderRadius: "8px",
                  backgroundColor: "white",
                }}
              />
            </div>

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

          {/* SORT INDICATOR */}
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

          {/* TABLE */}
          {loading ? (
            <p style={{ color: "#888", padding: "1rem" }}>Loading...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ color: "#888", padding: "1rem" }}>No orders found.</p>
          ) : (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "15px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #262626" }}>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDER ID</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>AMOUNT</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>DATE ORDERED</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDERED BY</th>
                    <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((order, idx) => {
                    const badge = STATUS_STYLES[order.order_status] || { backgroundColor: "#e0e0e0", color: "#333" };
                    return (
                      <tr
                        key={order.order_id}
                        onClick={() => handleOrderClick(order)}
                        style={{
                          borderBottom: idx < paginatedData.length - 1 ? "1px solid #e0e0e0" : "none",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <td style={{ padding: "15px", fontSize: "14px", fontWeight: "600" }}>{order.order_id}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>₱ {fmt(order.total_amount || 0)}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>{order.date_ordered}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>{order.customer_name}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            ...badge,
                          }}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        </main>
      </div>
    </div>
  );
}
