import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function AllOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date_submitted", direction: "desc" });

  useEffect(() => {
    fetch("http://localhost:8000/api/um/all-orders/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load orders: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Sort by date descending (most recent first) by default
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.date_submitted);
          const dateB = new Date(b.date_submitted);
          return dateB - dateA; // descending
        });
        setOrders(sorted);
        setFilteredOrders(sorted);
      })
      .catch(err => {
        console.error("Failed to load orders", err);
      });
  }, []);

  // Handle search
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
    
    // Re-apply current sort to filtered results
    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "order_id") {
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        } else if (sortConfig.key === "amount") {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortConfig.key === "date_submitted") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
      setFilteredOrders(sorted);
    } else {
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders, sortConfig]);

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredOrders].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle numeric values
      if (key === "order_id") {
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
      } else if (key === "amount") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      // Handle dates - convert to Date objects for proper comparison
      else if (key === "date_submitted") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      // Handle strings (ordered_by, status)
      else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return direction === "asc" ? -1 : 1;
      }
      if (aVal > bVal) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    setFilteredOrders(sorted);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "PENDING":
        return "#FFF3CD";
      case "APPROVED":
        return "#D1E7DD";
      case "PROCESSING":
        return "#FFF3CD";
      case "COMPLETED":
        return "#D1E7DD";
      case "CANCELLED":
        return "#F8D7DA";
      default:
        return "#E9ECEF";
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "PENDING":
        return "Pending Processing";
      case "APPROVED":
        return "Credit Approved";
      case "PROCESSING":
        return "Processing";
      case "COMPLETED":
        return "Order Completed";
      case "CANCELLED":
        return "Credit Rejected";
      default:
        return status;
    }
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
          <button className="um-logout-btn" onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <Sidebar />

        <main className="um-dashboard-content">
          <h1 className="um-welcome-text">View Orders</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
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
            <button
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                border: "1px solid #262626",
                borderRadius: "8px",
                backgroundColor: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onClick={() => handleSort(sortConfig.key)}
            >
              ↕ Sort By
            </button>
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
                  <th 
                    onClick={() => handleSort("order_id")}
                    style={{ 
                      padding: "15px 20px", 
                      textAlign: "left", 
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    ORDER ID {sortConfig.key === "order_id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    onClick={() => handleSort("amount")}
                    style={{ 
                      padding: "15px 20px", 
                      textAlign: "left", 
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    AMOUNT {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    onClick={() => handleSort("date_submitted")}
                    style={{ 
                      padding: "15px 20px", 
                      textAlign: "left", 
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    DATE SUBMITTED {sortConfig.key === "date_submitted" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    onClick={() => handleSort("ordered_by")}
                    style={{ 
                      padding: "15px 20px", 
                      textAlign: "left", 
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    ORDERED BY {sortConfig.key === "ordered_by" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th 
                    onClick={() => handleSort("status")}
                    style={{ 
                      padding: "15px 20px", 
                      textAlign: "left", 
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    STATUS {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
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
                {filteredOrders.map((order) => (
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
                      <span style={{
                        backgroundColor: getStatusColor(order.status),
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}