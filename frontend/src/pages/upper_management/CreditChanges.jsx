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
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    apiFetch("/api/um/credit-increases/")
      .then((res) => res.json())
      .then(setRequests)
      .catch(console.error);
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const completed = requests.filter((r) => r.status !== "PENDING");

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "current_limit" || sortBy === "requested_limit") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (sortBy === "created_at" || sortBy === "reviewed_at") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      } else {
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedPending = sortData(pending);
  const sortedCompleted = sortData(completed);

  const pendingSortOptions = [
    { value: "created_at", label: "Date Submitted" },
    { value: "customer_name", label: "Customer Name" },
    { value: "current_limit", label: "Current Limit" },
    { value: "requested_limit", label: "Requested Limit" },
  ];

  const completedSortOptions = [
    { value: "reviewed_at", label: "Date" },
    { value: "customer_name", label: "Customer Name" },
    { value: "current_limit", label: "Current Limit" },
    { value: "requested_limit", label: "Requested Limit" },
    { value: "status", label: "Status" },
    { value: "reviewed_by", label: "Reviewed By" },
  ];

  const sortOptions = activeTab === "pending" ? pendingSortOptions : completedSortOptions;

  const getSortLabel = () => {
    const opt = sortOptions.find((o) => o.value === sortBy);
    return opt ? opt.label : "Date Submitted";
  };

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "created_at" || newSortBy === "reviewed_at" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSortBy(tab === "pending" ? "created_at" : "reviewed_at");
    setSortDirection("desc");
    setShowSortMenu(false);
  };

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
              onClick={() => handleTabChange("pending")}
            >
              Pending
            </button>
            <button
              className={`um-tab${activeTab === "completed" ? " active-tab" : ""}`}
              onClick={() => handleTabChange("completed")}
            >
              Completed
            </button>
          </div>

          {/* Sort Controls */}
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
                <span style={{ fontSize: "12px", color: "#666" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
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

          {activeTab === "pending" && (
            <div style={{
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "15px",
              overflow: "hidden",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CUSTOMER NAME</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REQUESTED CHANGES</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>JUSTIFICATION</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>DATE SUBMITTED</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPending.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                        No pending requests
                      </td>
                    </tr>
                  )}
                  {sortedPending.map((r) => (
                    <tr
                      key={r.request_id}
                      onClick={() => navigate(`/upper-management/credit-increase/${r.request_id}`)}
                      style={{ borderBottom: "1px solid #E9ECEF", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "15px 20px" }}>{r.customer_name}</td>
                      <td style={{ padding: "15px 20px" }}>
                        {r.requested_limit && <div>Limit: {formatCurrency(r.requested_limit)}</div>}
                        {r.requested_term && <div>Term: {r.requested_term} Days</div>}
                      </td>
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
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "16px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>CUSTOMER NAME</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REQUESTED CHANGES</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>STATUS</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>REVIEWED BY</th>
                    <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompleted.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                        No completed requests
                      </td>
                    </tr>
                  )}
                  {sortedCompleted.map((r) => (
                    <tr
                      key={r.request_id}
                      style={{ borderBottom: "1px solid #E9ECEF" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "15px 20px" }}>{r.customer_name}</td>
                      <td style={{ padding: "15px 20px" }}>
                        {r.requested_limit && <div>Limit: {formatCurrency(r.requested_limit)}</div>}
                        {r.requested_term && <div>Term: {r.requested_term} Days</div>}
                      </td>
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
