import apiFetch from "../../utils/apiFetch";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function CreditChanges() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    apiFetch("/api/um/credit-increases/")
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const completed = requests.filter((r) => r.status !== "PENDING");

  const formatCurrency = (val) =>
    `₱ ${parseFloat(val).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <h1 className="um-welcome-text">Credit Changes</h1>

          <div className="um-tabs-row">
            <button
              className={`um-tab${activeTab === "pending" ? " active-tab" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </button>
            <button
              className={`um-tab${activeTab === "completed" ? " active-tab" : ""}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
          </div>

          {activeTab === "pending" && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "15px",
              overflow: "hidden",
              marginTop: "20px",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CUSTOMER NAME</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CURRENT LIMIT</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REQUESTED LIMIT</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>JUSTIFICATION</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>DATE SUBMITTED</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                        No pending requests
                      </td>
                    </tr>
                  )}
                  {pending.map((r) => (
                    <tr
                      key={r.request_id}
                      onClick={() => navigate(`/upper-management/credit-increase/${r.request_id}`)}
                      style={{ borderBottom: "1px solid #E9ECEF", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "15px 20px" }}>{r.customer_name}</td>
                      <td style={{ padding: "15px 20px" }}>{formatCurrency(r.current_limit)}</td>
                      <td style={{ padding: "15px 20px" }}>{formatCurrency(r.requested_limit)}</td>
                      <td style={{ padding: "15px 20px", maxWidth: "200px" }}>
                        <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                          {r.justification}
                        </span>
                      </td>
                      <td style={{ padding: "15px 20px" }}>{r.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "completed" && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "15px",
              overflow: "hidden",
              marginTop: "20px",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CUSTOMER NAME</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CURRENT LIMIT</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REQUESTED LIMIT</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>STATUS</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REVIEWED BY</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                        No completed requests
                      </td>
                    </tr>
                  )}
                  {completed.map((r) => (
                    <tr
                      key={r.request_id}
                      style={{ borderBottom: "1px solid #E9ECEF" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "15px 20px" }}>{r.customer_name}</td>
                      <td style={{ padding: "15px 20px" }}>{formatCurrency(r.current_limit)}</td>
                      <td style={{ padding: "15px 20px" }}>{formatCurrency(r.requested_limit)}</td>
                      <td style={{ padding: "15px 20px" }}>
                        <span style={{
                          backgroundColor: r.status === "APPROVED" ? "#D1E7DD" : "#F8D7DA",
                          color: r.status === "APPROVED" ? "#0F5132" : "#842029",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "14px",
                          fontWeight: "600",
                        }}>
                          {r.status === "APPROVED" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td style={{ padding: "15px 20px" }}>{r.reviewed_by || "—"}</td>
                      <td style={{ padding: "15px 20px" }}>{r.reviewed_at || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
