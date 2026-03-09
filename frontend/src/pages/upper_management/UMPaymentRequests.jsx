import { API_BASE_URL } from "../../utils/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function UMPaymentRequests() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "date_paid", direction: "desc" });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/um/all-payments/`, {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load payments: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.date_paid);
          const dateB = new Date(b.date_paid);
          return dateB - dateA;
        });
        setPayments(sorted);
        setFilteredPayments(sorted);
      })
      .catch(err => {
        console.error("Failed to load payments", err);
      });
  }, []);

  useEffect(() => {
    let filtered;
    if (searchTerm === "") {
      filtered = payments;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = payments.filter(p =>
        p.customer_name.toLowerCase().includes(searchLower) ||
        p.payment_id.toString().includes(searchLower) ||
        p.status.toLowerCase().includes(searchLower)
      );
    }

    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "payment_id") {
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        } else if (sortConfig.key === "amount_paid") {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortConfig.key === "date_paid") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = (bVal || "").toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
      setFilteredPayments(sorted);
    } else {
      setFilteredPayments(filtered);
    }
  }, [searchTerm, payments, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "#FFF3CD";
      case "VERIFIED": return "#D1E7DD";
      case "REJECTED": return "#F8D7DA";
      default: return "#E9ECEF";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "PENDING": return "#856404";
      case "VERIFIED": return "#0F5132";
      case "REJECTED": return "#842029";
      default: return "#333";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING": return "Pending";
      case "VERIFIED": return "Verified";
      case "REJECTED": return "Rejected";
      default: return status;
    }
  };

  return (
    <div className="um-dashboard-wrapper">
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
          <h1 className="um-welcome-text">Payment Requests</h1>

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
                  <th onClick={() => handleSort("payment_id")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    PAYMENT ID {sortConfig.key === "payment_id" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("customer_name")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    CUSTOMER {sortConfig.key === "customer_name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("amount_paid")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    AMOUNT {sortConfig.key === "amount_paid" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("date_paid")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    DATE OF PAYMENT {sortConfig.key === "date_paid" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("status")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    STATUS {sortConfig.key === "status" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("confirmed_by")} style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700", cursor: "pointer", userSelect: "none" }}>
                    CONFIRMED BY {sortConfig.key === "confirmed_by" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No payment requests found
                    </td>
                  </tr>
                )}
                {filteredPayments.map((p) => (
                  <tr
                    key={p.payment_id}
                    style={{ borderBottom: "1px solid #E9ECEF" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <td style={{ padding: "15px 20px", fontWeight: "700" }}>
                      {p.payment_id}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      {p.customer_name}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      ₱ {parseFloat(p.amount_paid).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      {p.date_paid}
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      <span style={{
                        backgroundColor: getStatusColor(p.status),
                        color: getStatusTextColor(p.status),
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600"
                      }}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td style={{ padding: "15px 20px" }}>
                      {p.confirmed_by || "—"}
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
