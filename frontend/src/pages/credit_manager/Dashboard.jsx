import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CMSidebar from "../../components/credit_manager/CMSidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function CreditManagerDashboard() {
  const navigate = useNavigate();
  const user = { username: "CM1234" };

  const [creditData, setCreditData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // null = dashboard view

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/cm/pending-orders/", { credentials: "include" }).then((r) => r.json()),
      fetch("http://localhost:8000/api/cm/pending-payments/", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([cd, pm]) => {
        setCreditData(cd);
        setPayments(pm);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
        </header>
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  function fmt(n) {
    return parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
          <button className="um-logout-btn" onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <CMSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="um-dashboard-content">
          {/* WELCOME BANNER */}
          <h1 className="um-welcome-text">
            {!activeTab && `Hello, ${user.username}`}
            {activeTab === "credit" && "Credit Approval"}
            {activeTab === "payment" && "Payment Review"}
          </h1>

          {/* STAT CARDS - Only show on dashboard view */}
          {!activeTab && (
            <div className="um-stats-container">
              <div className="um-stat-card">
                <span className="um-stat-label">Pending Credit Approval</span>
                <span className="um-stat-number">{creditData?.pending_credit_count ?? 0}</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Pending Payment Review</span>
                <span className="um-stat-number">{creditData?.pending_payment_count ?? 0}</span>
              </div>
            </div>
          )}

          {/* CREDIT APPROVAL LIST */}
          {activeTab === "credit" && (
            <div className="um-list-container">
              {creditData?.pending_orders.length === 0 && (
                <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
              )}
              {creditData?.pending_orders.map((order) => (
                <div
                  key={order.order_id}
                  className="um-request-item"
                  onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="um-request-info">
                    <div className="um-request-id">ORDER ID XX{order.order_id}</div>
                    <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                </div>
              ))}
            </div>
          )}

          {/* PAYMENT REVIEW LIST */}
          {activeTab === "payment" && (
            <div className="um-list-container">
              {payments.length === 0 && (
                <p style={{ color: "#888", padding: "1rem" }}>No pending payments.</p>
              )}
              {payments.map((p) => (
                <div
                  key={p.payment_id}
                  className="um-request-item"
                  onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="um-request-info">
                    <div className="um-request-id">{p.customer_name}</div>
                    <div className="um-request-sub">Amount paid: ₱ {fmt(p.amount_paid)}</div>
                  </div>
                  <div className="um-request-date">Date Paid: {p.date_paid}</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}