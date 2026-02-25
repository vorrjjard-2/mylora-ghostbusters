import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/internal/Sidebar";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ username: "" });

  useEffect(() => {
    fetch("http://localhost:8000/api/me/", { credentials: "include" })
      .then(r => r.json())
      .then(data => { if (data.username) setUser({ username: data.username }); })
      .catch(console.error);
  }, []);

  const [enrollments, setEnrollments] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("enrollments");

  useEffect(() => {
    fetch("http://localhost:8000/api/enrollments/pending/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load enrollments: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setEnrollments(data))
      .catch(err => {
        console.error("Failed to load enrollments", err);
      });

    fetch("http://localhost:8000/api/um/pending-overrides/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load overrides: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setOverrideRequests(data))
      .catch(err => {
        console.error("Failed to load override requests", err);
      });

    fetch("http://localhost:8000/api/um/pending-orders/", {
      credentials: "include"
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load pending orders: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setPendingOrders(data))
      .catch(err => {
        console.error("Failed to load pending orders", err);
      });
  }, []);

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
            {/* SECTION 2: WELCOME BANNER */}
            <h1 className="um-welcome-text">Hello, {user.username}</h1>

            {/* SECTION 3: STAT CARDS */}
            <div className="um-stats-container">
              <div className="um-stat-card">
                <span className="um-stat-label">Enrollment Requests</span>
                <span className="um-stat-number">{enrollments.length}</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Credit Override</span>
                <span className="um-stat-number">{overrideRequests.length}</span>
              </div>
              <div className="um-stat-card">
                <span className="um-stat-label">Order Processing</span>
                <span className="um-stat-number">{pendingOrders.length}</span>
              </div>
            </div>

            {/* SECTION 4: TABS */}
            <div className="um-tabs-row">
              <button 
                className={`um-tab ${activeTab === "enrollments" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("enrollments")}
              >
                Enrollment Requests
              </button>
              <button 
                className={`um-tab ${activeTab === "overrides" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("overrides")}
              >
                Credit Override
              </button>
              <button 
                className={`um-tab ${activeTab === "orders" ? "active-tab" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Order Processing
              </button>
            </div>

            {/* SECTION 5: LIST */}
            <div className="um-list-container">
              {activeTab === "enrollments" && (
                <>
                  {enrollments.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending enrollment requests.</p>}
                  {enrollments.map((e) => (
                    <div key={e.application_id} className="um-request-item">
                      <div className="um-request-info">
                        <Link to={`/upper-management/enrollments/${e.application_id}`} className="um-request-id">
                          {e.application_id.slice(0, 8).toUpperCase()}
                        </Link>
                        <div className="um-request-sub">Submitted by: {e.name}</div>
                      </div>
                      <div className="um-request-date">Date Submitted: {e.date}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "overrides" && (
                <>
                  {overrideRequests.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending override requests.</p>}
                  {overrideRequests.map((override) => (
                    <div 
                      key={override.override_id} 
                      className="um-request-item"
                      onClick={() => navigate(`/upper-management/override/${override.override_id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="um-request-info">
                        <div className="um-request-id">ORDER ID {override.order_id}</div>
                        <div className="um-request-sub">Customer: {override.customer_name}</div>
                      </div>
                      <div className="um-request-date">Date Submitted: {override.date_submitted}</div>
                    </div>
                  ))}
                </>
              )}

              {activeTab === "orders" && (
                <>
                  {pendingOrders.length === 0 && <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>}
                  {pendingOrders.map((order) => (
                    <div 
                      key={order.order_id} 
                      className="um-request-item"
                      style={{ cursor: "default" }}
                    >
                      <div className="um-request-info">
                        <div className="um-request-id">ORDER ID {order.order_id}</div>
                        <div className="um-request-sub">Customer: {order.customer_name} | Amount: ₱{parseFloat(order.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="um-request-date">
                        Status: {order.status === "PENDING" ? "Pending Credit Approval" : "Pending Processing"} | {order.date_submitted}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </main>
      </div>
    </div>
  ); 
}