import apiFetch from "../../utils/apiFetch";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import { handleLogout } from "../../utils/logout";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function AuditLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredLogs, 10, [searchTerm, sortBy, sortDirection]);

  useEffect(() => {
    apiFetch("/api/um/audit-logs/")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load audit logs: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setFilteredLogs(data);
      })
      .catch((err) => {
        console.error("Failed to load audit logs", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle search + sort
  useEffect(() => {
    let filtered;
    if (searchTerm === "") {
      filtered = logs;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = logs.filter((log) => {
        return (
          log.actor.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower)
        );
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "timestamp") {
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
    setFilteredLogs(sorted);
  }, [searchTerm, logs, sortBy, sortDirection]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "timestamp" ? "desc" : "asc");
    }
    setShowSortMenu(false);
  };

  const sortOptions = [
    { value: "timestamp", label: "Datetime" },
    { value: "actor", label: "Actor" },
    { value: "action", label: "Action" },
  ];

  const getSortLabel = () => {
    const opt = sortOptions.find(o => o.value === sortBy);
    return opt ? opt.label : "Datetime";
  };

  const formatAction = (action) => {
    return action.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
        </header>
        <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
          <Sidebar />
          <main className="um-dashboard-content">
            <p>Loading audit logs...</p>
          </main>
        </div>
      </div>
    );
  }

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
          <h1 className="um-welcome-text">Audit Log</h1>

          {/* Search and Sort Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>Sorted by:</span>
              <span style={{ padding: "6px 12px", backgroundColor: "#1E2D1A", color: "white", borderRadius: "20px", fontSize: "14px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {getSortLabel()}
                <span style={{ fontSize: "12px" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
              </span>
            </div>
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div style={{ position: "relative", maxWidth: "300px" }}>
                <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>&#128269;</span>
                <input type="text" placeholder="Search by actor or action" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "10px 10px 10px 45px", fontSize: "16px", border: "1px solid #262626", borderRadius: "8px", backgroundColor: "white" }} />
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowSortMenu(!showSortMenu)} style={{ padding: "10px 20px", fontSize: "16px", border: "1px solid #262626", borderRadius: "8px", backgroundColor: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                  <span>↕</span>
                  <span>Sort By: {getSortLabel()}</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>{sortDirection === "asc" ? "↑" : "↓"}</span>
                </button>
                {showSortMenu && (
                  <div style={{ position: "absolute", top: "calc(100% + 5px)", right: 0, backgroundColor: "white", border: "1px solid #262626", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", minWidth: "200px", zIndex: 1000 }}>
                    {sortOptions.map((option, index) => (
                      <div key={option.value} onClick={() => handleSortChange(option.value)} style={{ padding: "12px 16px", cursor: "pointer", borderBottom: index < sortOptions.length - 1 ? "1px solid #e0e0e0" : "none", backgroundColor: sortBy === option.value ? "#f5f5f5" : "white", fontWeight: sortBy === option.value ? "600" : "400", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: index === sortOptions.length - 1 ? "0 0 8px 8px" : index === 0 ? "8px 8px 0 0" : "0" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = sortBy === option.value ? "#f5f5f5" : "white"}>
                        <span>{option.label}</span>
                        {sortBy === option.value && <span>{sortDirection === "asc" ? "↑" : "↓"}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Log Table */}
          <div style={{
            backgroundColor: "white",
            border: "1px solid #262626",
            borderRadius: "15px",
            overflow: "hidden",
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "16px",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#F9F9F9", borderBottom: "1px solid #262626" }}>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>
                    DATETIME
                  </th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>
                    ACTOR
                  </th>
                  <th style={{ padding: "15px 20px", textAlign: "left", fontWeight: "700" }}>
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: "30px", textAlign: "center", color: "#888" }}>
                      No audit logs found
                    </td>
                  </tr>
                )}
                {paginatedData.map((log) => (
                  <React.Fragment key={log.log_id}>
                    <tr
                      style={{
                        borderBottom: "1px solid #E9ECEF",
                        cursor: log.details ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (log.details) {
                          setExpandedRow(expandedRow === log.log_id ? null : log.log_id);
                        }
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9F9F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <td style={{ padding: "15px 20px" }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: "15px 20px" }}>
                        {log.actor}
                      </td>
                      <td style={{ padding: "15px 20px", fontWeight: "600" }}>
                        {formatAction(log.action)}
                      </td>
                    </tr>
                    {expandedRow === log.log_id && log.details && (
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            backgroundColor: "#F9F9F9",
                            padding: "15px 30px",
                            borderBottom: "1px solid #E9ECEF",
                          }}
                        >
                          <div style={{ fontSize: "14px", color: "#555" }}>
                            <strong>Details:</strong>
                            <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "10px 30px" }}>
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key}>
                                  <span style={{ fontWeight: 600, color: "#333" }}>{key.replace(/_/g, " ")}:</span>{" "}
                                  {String(value)}
                                </div>
                              ))}
                            </div>
                            {log.ip_address && (
                              <div style={{ marginTop: "8px", color: "#888" }}>
                                IP: {log.ip_address}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
