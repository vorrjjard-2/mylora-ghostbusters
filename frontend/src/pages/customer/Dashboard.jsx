import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import { handleLogout } from "../../utils/logout";
import useIsMobile from "../../hooks/useIsMobile";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import MobileBottomNav from "../../components/MobileBottomNav";
import logo from "../../assets/mylora-logo.png";
import { getOrderStatusLabel, orderStatusBadgeStyle } from "../../utils/orderStatus";
import "./Dashboard.css";

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Notification state
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);
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

  const notifPag = usePagination(notifHistory, 5, []);

  const handleOpenHistory = async () => {
    const opening = !showHistory;
    setShowHistory(opening);

    if (opening && unreadCount > 0) {
      try {
        await fetch(`${API_BASE_URL}/api/customer/notifications/mark-read/`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
        });
        setNotifHistory((prev) =>
          prev.map((n) => (n.is_read ? n : { ...n, is_read: true }))
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAcknowledge = async () => {
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

  const unreadCount = notifHistory.filter((n) => !n.is_read).length;

return (
    <div className="cd-container">
      {/* Header Section */}
      <header className="cd-main-header">
        <div className="cd-brand-group">
          <img src={logo} alt="Mylora Logo" className="cd-logo-img" />
          {!isMobile && <span className="cd-system-title">Web Credit System</span>}
        </div>
        <div className="cd-header-actions">
          {/* Notification Bell */}
          <div ref={historyRef} style={{ position: "relative" }}>
            <button onClick={handleOpenHistory} className="cd-notif-bell-btn">
              🔔
              {unreadCount > 0 && (
                <span className="cd-notif-badge">{unreadCount}</span>
              )}
            </button>

            {showHistory && (
              <div className="cd-notif-dropdown">
                <div className="cd-notif-dropdown-header">Notifications</div>
                {notifHistory.length === 0 ? (
                  <div className="cd-notif-empty">No notifications yet</div>
                ) : (
                  notifPag.paginatedData.map((n) => (
                    <div
                      key={n.notification_id}
                      className="cd-notif-item"
                      style={{ backgroundColor: n.is_read ? "white" : "#fff8e1" }}
                    >
                      <div className="cd-notif-message">{n.message}</div>
                      <div className="cd-notif-meta">
                        <span>{n.created_at}</span>
                        <span style={{ fontStyle: "italic" }}>
                          {n.is_read ? "Read" : "Unread"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <Pagination currentPage={notifPag.currentPage} totalPages={notifPag.totalPages} onPageChange={notifPag.goToPage} />
              </div>
            )}
          </div>

          {!isMobile && (
            <>
              <button className="cd-profile-btn" onClick={() => navigate("/account")}>
                Profile
              </button>
              <button className="cd-logout-btn" onClick={() => handleLogout(navigate)}>
                Logout
              </button>
            </>
          )}
          {isMobile && (
            <button className="cd-logout-btn" onClick={() => handleLogout(navigate)}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="cd-content">
        <h1 className={`cd-title ${isMobile ? "cd-title-mobile" : ""}`}>Hello, {data.user.name}</h1>

        {/* Action Cards — hidden on mobile since bottom nav covers these */}
        {!isMobile && (
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
                <span>Payments</span>
              </div>
            </button>

            <button className="cd-action-card" onClick={() => navigate("/orders")}>
              <span className="cd-action-icon">📋</span>
              <div className="cd-action-text">
                <span>View Order History</span>
              </div>
            </button>

            <button className="cd-action-card" onClick={() => navigate("/credit/history")}>
              <span className="cd-action-icon">💳</span>
              <div className="cd-action-text">
                <span>Credit History</span>
              </div>
            </button>

            <button className="cd-action-card" onClick={() => navigate("/credit/increase")}>
              <span className="cd-action-icon">↑</span>
              <div className="cd-action-text">
                <span>Request Credit</span>
                <span>Increase</span>
              </div>
            </button>
          </div>
        )}

        {/* Credit Term + Balance Section */}
        {isMobile ? (
          <div className="cd-credit-mobile">
            <div className="cd-credit-mobile-title">Credit Status</div>
            <div className="cd-credit-mobile-header">
              <span className="cd-credit-mobile-term">
                Credit Term: {data.credit.credit_term ? `${data.credit.credit_term} days` : "N/A"}
              </span>
            </div>
            <div className="cd-credit-mobile-row">
              <div className="cd-credit-mobile-stat">
                <span className="cd-credit-mobile-label">Available</span>
                <span className="cd-credit-mobile-value">
                  ₱ {parseFloat(data.credit.available_credit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cd-credit-mobile-stat">
                <span className="cd-credit-mobile-label">Limit</span>
                <span className="cd-credit-mobile-value">
                  ₱ {parseFloat(data.credit.credit_limit).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="cd-progress-container" style={{ height: "10px", borderRadius: "5px", marginBottom: "10px" }}>
              <div
                className="cd-progress-bar"
                style={{
                  width: `${Math.min(creditUtilization, 100)}%`,
                  background: exceedsCreditLimit ? "#c62828" : "#86A07D",
                }}
              />
            </div>
            <div className="cd-credit-mobile-balance">
              <span className="cd-credit-mobile-label">Outstanding Balance</span>
              <span className="cd-credit-mobile-balance-amount">
                ₱ {parseFloat(data.credit.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ) : (
          <fieldset className="cd-credit-fieldset">
            <legend className="cd-credit-legend">
              Credit Term: {data.credit.credit_term ? `${data.credit.credit_term} days` : "N/A"}
            </legend>

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

            <div className="cd-balance-section">
              <h2 className="cd-section-title">Outstanding Balance</h2>
              <div className="cd-balance-amount">
                ₱ {parseFloat(data.credit.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </fieldset>
        )}

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
          ) : isMobile ? (
            <div className="mobile-card-list">
              {data.recent_orders.slice(0, 5).map((order) => (
                <div key={order.order_id} className="mobile-card" onClick={() => navigate(`/orders/${order.raw_id}`)}>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Order ID</span>
                    <span className="mobile-card-value">{order.order_id}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Amount</span>
                    <span className="mobile-card-value">₱ {parseFloat(order.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Date</span>
                    <span className="mobile-card-value">{order.date_ordered}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Status</span>
                    <span style={orderStatusBadgeStyle(order.status)}>{getOrderStatusLabel(order.status)}</span>
                  </div>
                </div>
              ))}
            </div>
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
                        <span style={orderStatusBadgeStyle(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Mobile: Create Purchase button at bottom */}
        {isMobile && (
          <button className="cd-mobile-create-btn" onClick={() => navigate("/orders/create")}>
            + Create Purchase Request
          </button>
        )}
      </main>

      {/* Bottom Nav for Mobile */}
      {isMobile && <MobileBottomNav />}

      {/* Notification Acknowledgment Modal */}
      {currentNotification && (
        <div className="cd-notif-modal-overlay">
          <div className="cd-notif-modal">
            <h2 className="cd-notif-modal-title">Important Notice</h2>
            <p className="cd-notif-modal-date">{currentNotification.created_at}</p>

            <div className="cd-notif-modal-body">
              {currentNotification.message}
            </div>

            <div className="cd-notif-modal-actions">
              <button onClick={handleAcknowledge} className="cd-notif-ack-btn">
                Acknowledge
              </button>
            </div>

            {unreadNotifications.length > 1 && (
              <p className="cd-notif-modal-remaining">
                {unreadNotifications.length - 1} more notification{unreadNotifications.length - 1 > 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

