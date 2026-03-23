import apiFetch from "../../utils/apiFetch";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import { getOrderStatusLabel, orderStatusBadgeStyle } from "../../utils/orderStatus";
import "./Dashboard.css";

export default function AllOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date_submitted");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredOrders, 10, [searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    apiFetch("/api/um/all-orders/")
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load orders: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.date_submitted);
          const dateB = new Date(b.date_submitted);
          return dateB - dateA;
        });
        setOrders(sorted);
        setFilteredOrders(sorted);
      })
      .catch(err => {
        console.error("Failed to load orders", err);
      });
  }, []);

  // Handle search + sort
  useEffect(() => {
    let filtered;
    if (searchTerm === "") {
      filtered = orders;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = orders.filter(order => {
        const orderIdWithPrefix = `xx${order.order_id}`.toLowerCase();
        const orderIdPlain = order.order_id.toString().toLowerCase();

        return orderIdWithPrefix.includes(searchLower) ||
               orderIdPlain.includes(searchLower) ||
               order.ordered_by.toLowerCase().includes(searchLower) ||
               order.status.toLowerCase().includes(searchLower);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "order_id") {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (sortBy === "amount") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortBy === "date_submitted") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredOrders(sorted);
  }, [searchTerm, orders, sortBy, sortDirection]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "date_submitted" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: "date_submitted", label: "Date Submitted" },
    { value: "order_id", label: "Order ID" },
    { value: "ordered_by", label: "Ordered By" },
    { value: "amount", label: "Amount" },
    { value: "status", label: "Status" },
  ];

  const getSortLabel = () => {
    const opt = sortOptions.find(o => o.value === sortBy);
    return opt ? opt.label : "Date Submitted";
  };

  return (
    <div className="um-dashboard-wrapper">
      {/* HEADER */}
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">View Orders</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
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
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{ position: "relative", maxWidth: "300px" }}>
                <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 10px 10px 45px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white"
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
                          borderRadius: index === sortOptions.length - 1 ? "0 0 8px 8px" : index === 0 ? "8px 8px 0 0" : "0"
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
          </div>

          {/* Orders Table */}
          <div style={{
            backgroundColor: "white",
            border: "1px solid #262626",
            borderRadius: "15px",
            overflow: "hidden"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "16px"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>ORDER ID</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>AMOUNT</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>DATE SUBMITTED</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>ORDERED BY</th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No orders found
                    </td>
                  </tr>
                )}
                {paginatedData.map((order) => (
                  <tr
                    key={order.order_id}
                    onClick={() => navigate(`/upper-management/customer/${order.customer_id}/order/${order.order_id}`, { state: { from: "/upper-management/all-orders" } })}
                    style={{
                      borderBottom: "1px solid #E9ECEF",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ padding: "15px 20px", fontWeight: "700" }}>
                      {order.order_id}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      ₱ {parseFloat(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      {order.date_submitted}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      {order.ordered_by}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      <span style={orderStatusBadgeStyle(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
        </main>
      </div>
    </div>
  );
}
