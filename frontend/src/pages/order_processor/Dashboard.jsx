import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import { getCookie } from "../../utils/csrf";
import "./Dashboard.css";

export default function OrderProcessorDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, meRes] = await Promise.all([
          fetch("http://localhost:8000/api/op/pending-orders/", { credentials: "include" }),
          fetch("http://localhost:8000/api/me/", { credentials: "include" }),
        ]);
        if (!ordersRes.ok) throw new Error("Failed to load orders");
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
        if (meRes.ok) {
          const me = await meRes.json();
          setUserName(me.username || "");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
    navigate("/login");
  };

  return (
    <div className="op-dash-root">
      {/* HEADER */}
      <header className="op-dash-header">
        <div className="op-dash-brand">
          <img src={logo} alt="Logo" className="op-dash-logo" />
          <span className="op-dash-brand-name">Web Credit System</span>
        </div>
        <button className="op-dash-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="op-dash-body">
        {/* SIDEBAR */}
        <aside className="op-dash-sidebar">
          <div className="op-dash-side-item op-dash-side-active">Dashboard</div>
          <div
            className="op-dash-side-item"
            onClick={() => navigate("/order-processor/history")}
          >
            Order History
          </div>
        </aside>

        {/* MAIN */}
        <main className="op-dash-main">
          <h1 className="op-dash-greeting">
            Hello, {userName || "Order Processor"}
          </h1>

          {/* Summary Card */}
          <div className="op-dash-card-row">
            <div className="op-dash-card">
              <div className="op-dash-card-label">For Processing</div>
              <div className="op-dash-card-count">
                {loading ? "..." : orders.length}
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <h2 className="op-dash-section-title">Pending Orders:</h2>

          {loading ? (
            <div className="op-dash-empty">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="op-dash-empty">No pending orders.</div>
          ) : (
            <div className="op-dash-list">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="op-dash-list-item"
                  onClick={() => navigate(`/order-processor/order/${order.order_id}`)}
                >
                  <div className="op-dash-item-left">
                    <div className="op-dash-order-id">ORDER ID XX{order.order_id}</div>
                    <div className="op-dash-order-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="op-dash-item-right">
                    <span className="op-dash-badge">{order.order_status}</span>
                    <div className="op-dash-order-date">
                      Date Ordered: {order.date_ordered}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}