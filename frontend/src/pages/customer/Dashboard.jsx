import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Notification state
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [ackInput, setAckInput] = useState("");
  const [ackError, setAckError] = useState("");
  const [notifHistory, setNotifHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/customer/dashboard/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        alert("Failed to load dashboard data");
      })
      .finally(() => setLoading(false));

    // Fetch unread notifications
    fetch(`${API_BASE_URL}/api/customer/notifications/unread/`, { credentials: "include" })
      .then((r) => r.json())
      .then((notifs) => {
        setUnreadNotifications(notifs);
        if (notifs.length > 0) setCurrentNotification(notifs[0]);
      })
      .catch(console.error);

    // Fetch notification history
    fetch(`${API_BASE_URL}/api/customer/notifications/history/`, { credentials: "include" })
      .then((r) => r.json())
      .then(setNotifHistory)
      .catch(console.error);
  }, []);

  // Close history dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAcknowledge = async () => {
    if (ackInput.trim().toLowerCase() !== "i understand") {
      setAckError('Please type "I understand" to continue.');
      return;
    }

    try {
      await fetch(
        `${API_BASE_URL}/api/customer/notifications/${currentNotification.notification_id}/acknowledge/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      const remaining = unreadNotifications.filter(
        (n) => n.notification_id !== currentNotification.notification_id
      );
      setUnreadNotifications(remaining);
      setAckInput("");
      setAckError("");

      if (remaining.length > 0) {
        setCurrentNotification(remaining[0]);
      } else {
        setCurrentNotification(null);
      }

      // Refresh history
      fetch(`${API_BASE_URL}/api/customer/notifications/history/`, { credentials: "include" })
        .then((r) => r.json())
        .then(setNotifHistory)
        .catch(console.error);
    } catch (err) {
      console.error(err);
      setAckError("Failed to acknowledge. Please try again.");
    }
  };

  if (loading) {
    return <div className="cd-container">Loading...</div>;
  }

  if (!data) {
    return <div className="cd-container">Unable to load dashboard</div>;
  }

  const creditUtilization = data.credit
    ? ((parseFloat(data.credit.credit_limit) - parseFloat(data.credit.available_credit)) /
        parseFloat(data.credit.credit_limit)) *
      100
    : 0;

  const exceedsCreditLimit = data.credit
    ? parseFloat(data.credit.outstanding_balance) > parseFloat(data.credit.credit_limit)
    : false;

  const unreadCount = unreadNotifications.length;

return (
    <div className="cd-container">
      {/* Header Section */}
      <header className="cd-main-header">
        <div className="cd-brand-group">
          <img src={logo} alt="Mylora Logo" className="cd-logo-img" />
          <span className="cd-system-title">Web Credit System</span>
        </div>
        <div className="cd-header-actions">
          {/* Notification Bell */}
          <div ref={historyRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                background: "white",
                border: "1.3px solid #183112",
                borderRadius: "10px",
                height: "41px",
                width: "50px",
                cursor: "pointer",
                position: "relative",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🔔
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: "-5px", right: "-5px",
                  backgroundColor: "#dc3545", color: "white",
                  borderRadius: "50%", width: "20px", height: "20px",
                  fontSize: "12px", fontWeight: "700",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showHistory && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                width: "380px", maxHeight: "400px", overflowY: "auto",
                backgroundColor: "white", border: "1px solid #262626",
                borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                zIndex: 1000, fontFamily: "'Arimo', sans-serif",
              }}>
                <div style={{
                  padding: "15px 20px", borderBottom: "1px solid #e0e0e0",
                  fontWeight: "700", fontSize: "16px",
                }}>
                  Notifications
                </div>
                {notifHistory.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#888", fontSize: "14px" }}>
                    No notifications yet
                  </div>
                ) : (
                  notifHistory.map((n) => (
                    <div
                      key={n.notification_id}
                      style={{
                        padding: "12px 20px",
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: n.is_read ? "white" : "#fff8e1",
                      }}
                    >
                      <div style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "6px" }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", display: "flex", justifyContent: "space-between" }}>
                        <span>{n.created_at}</span>
                        <span style={{ fontStyle: "italic" }}>
                          {n.is_read ? "Read" : "Unread"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button className="cd-profile-btn" onClick={() => navigate("/account")}>
            Profile
          </button>
          <button className="cd-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <main className="cd-content">
        <h1 className="cd-title">Hello, {data.user.name}</h1>

        {/* Action Cards */}
        <div className="cd-action-grid">
          <button className="cd-action-card" onClick={() => navigate("/orders/create")}>
            <span className="cd-action-icon">+</span>
            <div className="cd-action-text">
              <span>Create Purchase</span>
              <span>Request</span>
            </div>
          </button>

          <button className="cd-action-card" onClick={() => navigate("/credit/update")}>
            <span className="cd-action-icon">⟳</span>
            <div className="cd-action-text">
              <span>Update Credit</span>
              <span>Balance</span>
            </div>
          </button>

          <button className="cd-action-card" onClick={() => navigate("/orders")}>
            <span className="cd-action-icon">📋</span>
            <div className="cd-action-text">
              <span>View Order History</span>
            </div>
          </button>
        </div>

        {/* Credit Balance Section */}
        <div className="cd-section">
          <h2 className="cd-section-title">Your Credit Balance</h2>
          <div className="cd-credit-info">
            <div className="cd-credit-row">
              <span className="cd-label">Available Credit:</span>
              <span className="cd-credit-value">
                ₱ {parseFloat(data.credit.available_credit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="cd-credit-row align-right">
              <span className="cd-label">Credit Limit:</span>
              <span className="cd-credit-limit">
                ₱ {parseFloat(data.credit.credit_limit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="cd-progress-container">
            <div
              className="cd-progress-bar"
              style={{
                width: `${Math.min(creditUtilization, 100)}%`,
                background: exceedsCreditLimit ? "#c62828" : "#86A07D",
              }}
            />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="cd-balance-section">
          <h2 className="cd-section-title">Outstanding Balance</h2>
          <div className="cd-balance-amount">
            ₱ {parseFloat(data.credit.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="cd-section">
          <div className="cd-section-header">
            <h2 className="cd-section-title">Recent Orders</h2>
            <button className="cd-view-all-btn" onClick={() => navigate("/orders")}>
              View All Orders →
            </button>
          </div>

          {data.recent_orders.length === 0 ? (
            <p className="cd-no-orders">No orders yet</p>
          ) : (
            <div className="cd-table-wrapper">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th className="cd-th">ORDER ID</th>
                    <th className="cd-th">AMOUNT</th>
                    <th className="cd-th">DATE ORDERED</th>
                    <th className="cd-th">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders.map((order) => (
                    <tr key={order.order_id} className="cd-table-row" onClick={() => navigate(`/orders/${order.raw_id}`)}>
                      <td className="cd-td">{order.order_id}</td>
                      <td className="cd-td">₱ {parseFloat(order.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="cd-td">{order.date_ordered}</td>
                      <td className="cd-td">
                        <span className={`cd-status-badge status-${order.status.toLowerCase()}`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Notification Acknowledgment Modal */}
      {currentNotification && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: "white", borderRadius: "15px",
            padding: "40px", width: "500px", maxWidth: "90vw",
            fontFamily: "'Arimo', sans-serif",
          }}>
            <h2 style={{ fontSize: "24px", fontWeight: "700", marginTop: 0, marginBottom: "8px", color: "#262626" }}>
              Important Notice
            </h2>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "20px" }}>
              {currentNotification.created_at}
            </p>

            <div style={{
              backgroundColor: "#FFF8E1", border: "1px solid #FFE082",
              borderRadius: "10px", padding: "20px",
              fontSize: "16px", lineHeight: "1.6", marginBottom: "25px",
            }}>
              {currentNotification.message}
            </div>

            <p style={{ fontSize: "14px", color: "#555", marginBottom: "10px" }}>
              Type <strong>"I understand"</strong> to acknowledge this notice:
            </p>

            {ackError && (
              <div style={{
                backgroundColor: "#F8D7DA", color: "#842029",
                padding: "8px 12px", borderRadius: "6px",
                marginBottom: "10px", fontSize: "13px",
              }}>
                {ackError}
              </div>
            )}

            <input
              type="text"
              value={ackInput}
              onChange={(e) => { setAckInput(e.target.value); setAckError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAcknowledge(); }}
              placeholder='Type "I understand"'
              style={{
                width: "100%", padding: "12px", fontSize: "16px",
                border: "1px solid #262626", borderRadius: "8px",
                boxSizing: "border-box", marginBottom: "20px",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAcknowledge}
                style={{
                  padding: "10px 28px", fontSize: "16px", fontWeight: "600",
                  border: "none", borderRadius: "8px",
                  backgroundColor: "#1E2D1A", color: "white", cursor: "pointer",
                }}
              >
                Acknowledge
              </button>
            </div>

            {unreadNotifications.length > 1 && (
              <p style={{ fontSize: "12px", color: "#888", marginTop: "15px", textAlign: "center" }}>
                {unreadNotifications.length - 1} more notification{unreadNotifications.length - 1 > 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatStatus(status) {
  const map = {
    PENDING: "Pending Approval",
    APPROVED: "Approved",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
  };
  return map[status] || status;
}
