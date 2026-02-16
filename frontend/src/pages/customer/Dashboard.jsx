import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    /*fetch("http://localhost:8000/api/customer/dashboard/", {
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
      .finally(() => setLoading(false));*/ // RETURN BEFORE COMMITTING 

      setData({ // REMOVE BEFORE COMMITTING
      user: { name: "Alex Fernandez" },
      credit: {
        available_credit: "75000.00",
        credit_limit: "100000.00",
        outstanding_balance: "25000.00"
      },
      recent_orders: [
        { order_id: "ORD-001", amount: "5000.00", date_ordered: "2026-02-10", status: "APPROVED", raw_id: 1 },
        { order_id: "ORD-002", amount: "1200.00", date_ordered: "2026-02-12", status: "PENDING", raw_id: 2 },
      ]
    });
    setLoading(false); // REMOVE BEFORE COMMITTING

  }, []);

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

return (
    <div className="cd-container">
      {/* Header Section */}
      <header className="cd-main-header">
        <div className="cd-brand-group">
          <img src={logo} alt="Mylora Logo" className="cd-logo-img" />
          <span className="cd-system-title">Web Credit System</span>
        </div>
        <div className="cd-header-actions">
          <button className="cd-profile-btn" onClick={() => navigate("/account")}>
            Profile
          </button>
          <button className="cd-logout-btn" onClick={() => navigate("/login")}>
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

function getStatusBadgeStyle(status) {
  const base = {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500",
  };
  switch (status) {
    case "APPROVED":
      return { ...base, background: "#d4edda", color: "#155724" };
    case "REJECTED":
      return { ...base, background: "#f8d7da", color: "#721c24" };
    case "PENDING":
      return { ...base, background: "#fff3cd", color: "#856404" };
    case "PROCESSING":
      return { ...base, background: "#cce5ff", color: "#004085" };
    case "COMPLETED":
      return { ...base, background: "#d1ecf1", color: "#0c5460" };
    case "CANCELLED":
      return { ...base, background: "#e2e3e5", color: "#383d41" };
    default:
      return { ...base, background: "#f5f5f5", color: "#333" };
  }
}

