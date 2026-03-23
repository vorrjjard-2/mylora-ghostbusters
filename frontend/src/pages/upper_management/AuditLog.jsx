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
  const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(filteredLogs, 10, [searchTerm, sortConfig]);

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

    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "timestamp") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        } else if (typeof aVal === "string") {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
      setFilteredLogs(sorted);
    } else {
      setFilteredLogs(filtered);
    }
  }, [searchTerm, logs, sortConfig]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
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
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
              <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>&#128269;</span>
              <input
                type="text"
                placeholder="Search by actor or action"
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
                gap: "8px",
              }}
              onClick={() => handleSort(sortConfig.key)}
            >
              &#8597; Sort By
            </button>
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
                  <th
                    onClick={() => handleSort("timestamp")}
                    style={{
                      padding: "15px 20px",
                      textAlign: "left",
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    DATETIME {sortConfig.key === "timestamp" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
                  </th>
                  <th
                    onClick={() => handleSort("actor")}
                    style={{
                      padding: "15px 20px",
                      textAlign: "left",
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    ACTOR {sortConfig.key === "actor" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
                  </th>
                  <th
                    onClick={() => handleSort("action")}
                    style={{
                      padding: "15px 20px",
                      textAlign: "left",
                      fontWeight: "700",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    ACTION {sortConfig.key === "action" && (sortConfig.direction === "asc" ? "\u2191" : "\u2193")}
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
