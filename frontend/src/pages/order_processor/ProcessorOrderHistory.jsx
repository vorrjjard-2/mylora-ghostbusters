import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import { getCookie } from "../../utils/csrf";
import "./ProcessorOrderHistory.css";

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
          fetch("http://localhost:8000/api/op/pending-orders/", { credentials: "include" }),
          fetch("http://localhost:8000/api/op/completed-orders/", { credentials: "include" }),
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

  // Update filtered and sorted orders when dependencies change
  useEffect(() => {
    const orders = activeTab === "pending" ? pendingOrders : completedOrders;
    
    // First, filter by search term
    let filtered = orders.filter((o) => {
      const name = (o.customer_name || "").toLowerCase();
      const id = (o.order_id || "").toString();
      const term = searchTerm.toLowerCase();
      return name.includes(term) || id.includes(term);
    });

    // Then, sort
    if (filtered.length > 0) {
      const sorted = [...filtered].sort((a, b) => {
        let comparison = 0;

        if (sortBy === "order_id") {
          comparison = a.order_id - b.order_id;
        } else if (sortBy === "status") {
          comparison = a.order_status.localeCompare(b.order_status);
        } else if (sortBy === "date") {
          // For pending: use date_ordered, for completed: use completion_date
          const dateField = activeTab === "pending" ? "date_ordered" : "completion_date";
          const dateA = new Date(a[dateField]);
          const dateB = new Date(b[dateField]);
          comparison = dateA - dateB;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
      setFilteredOrders(sorted);
    } else {
      setFilteredOrders([]);
    }
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

  const getSortLabel = () => {
    if (sortBy === "date") return activeTab === "pending" ? "Date Ordered" : "Date Completed";
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

  const handleOrderClick = (order) => {
    if (activeTab === "pending") {
      navigate(`/order-processor/order/${order.order_id}`);
    } else {
      navigate(`/order-processor/order/${order.order_id}/view`);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
    setSortBy("date");
    setSortDirection("desc");
  };

  return (
    <div className="poh-root">
      {/* HEADER */}
      <header className="poh-header">
        <div className="poh-brand">
          <img src={logo} alt="Logo" className="poh-logo" />
          <span className="poh-brand-name">Web Credit System</span>
        </div>
        <button className="poh-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="poh-body">
        {/* SIDEBAR */}
        <aside className="poh-sidebar">
          <div
            className="poh-side-item"
            onClick={() => navigate("/order-processor/dashboard")}
          >
            Dashboard
          </div>
          <div className="poh-side-item poh-side-active">Order History</div>
        </aside>

        {/* MAIN */}
        <main className="poh-main">
          <h1 className="poh-title">View Orders</h1>

          {/* TABS */}
          <div className="poh-tabs">
            <button
              className={`poh-tab ${activeTab === "pending" ? "poh-tab-active" : ""}`}
              onClick={() => handleTabChange("pending")}
            >
              Pending Orders
            </button>
            <button
              className={`poh-tab ${activeTab === "completed" ? "poh-tab-active" : ""}`}
              onClick={() => handleTabChange("completed")}
            >
              Completed Orders
            </button>
          </div>

          {/* CONTROLS */}
          <div className="poh-controls">
            <div className="poh-search-wrap">
              <span className="poh-search-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#888" strokeWidth="1.5" />
                  <path d="M11 11L14 14" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className="poh-search-input"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Sort Button with Dropdown */}
            <div style={{ position: "relative" }}>
              <button 
                className="poh-sort-btn"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
                  <path d="M1 3h12M3 7h8M5 11h4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Sort By: {getSortLabel()} {sortDirection === "asc" ? "↑" : "↓"}
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
                    <span>{activeTab === "pending" ? "Date Ordered" : "Date Completed"}</span>
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
          <div style={{ marginBottom: "15px", marginTop: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
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

          {/* LIST */}
          {loading ? (
            <div className="poh-empty">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="poh-empty">No {activeTab} orders found.</div>
          ) : (
            <div className="poh-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  className="poh-list-item"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="poh-item-left">
                    <div className="poh-order-id">ORDER ID {order.order_id}</div>
                    <div className="poh-order-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="poh-item-right">
                    <div className="poh-badges">
                      <span className="poh-badge poh-badge-approved">APPROVED</span>
                      {activeTab === "completed" && (
                        <span className="poh-badge poh-badge-completed">COMPLETED</span>
                      )}
                    </div>
                    <div className="poh-order-date">
                      {activeTab === "pending"
                        ? `Date Ordered: ${order.date_ordered}`
                        : `Date Completed: ${order.completion_date}`}
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