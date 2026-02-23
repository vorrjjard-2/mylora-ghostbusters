import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import { getCookie } from "../../utils/csrf";
import "./ProcessorOrderHistory.css";

export default function ProcessorOrderHistory() {
  const navigate = useNavigate();
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [pendingRes, completedRes] = await Promise.all([
          fetch("http://localhost:8000/api/op/pending-orders/", { credentials: "include" }),
          fetch("http://localhost:8000/api/op/completed-orders/", { credentials: "include" }),
        ]);
        if (!pendingRes.ok || !completedRes.ok) throw new Error("Failed to load orders");
        const [pending, completed] = await Promise.all([pendingRes.json(), completedRes.json()]);
        setPendingOrders(pending);
        setCompletedOrders(completed);
      } catch (err) {
        console.error(err);
        alert("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchBoth();
  }, []);

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
    navigate("/login");
  };

  const orders = activeTab === "pending" ? pendingOrders : completedOrders;

  const filtered = orders.filter((o) => {
    const name = (o.customer_name || "").toLowerCase();
    const id = (o.order_id || "").toString();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || id.includes(term);
  });

  const handleOrderClick = (order) => {
    if (activeTab === "pending") {
      navigate(`/order-processor/order/${order.order_id}`);
    } else {
      navigate(`/order-processor/order/${order.order_id}/view`);
    }
  };

  return (
    <div className="poh-root">
      {/* HEADER */}
      <header className="poh-header">
        <div className="poh-brand">
          <img src={logo} alt="Logo" className="poh-logo" />
          <span className="poh-brand-name">Web Credit System</span>
        </div>
        <button className="poh-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className="poh-body">
        {/* SIDEBAR */}
        <aside className="poh-sidebar">
          <div
            className="poh-side-item"
            onClick={() => navigate("/order-processor/dashboard")}
          >
            Dashboard
          </div>
          <div className="poh-side-item poh-side-active">Order History</div>
        </aside>

        {/* MAIN */}
        <main className="poh-main">
          <h1 className="poh-title">View Orders</h1>

          {/* TABS */}
          <div className="poh-tabs">
            <button
              className={`poh-tab ${activeTab === "pending" ? "poh-tab-active" : ""}`}
              onClick={() => { setActiveTab("pending"); setSearchTerm(""); }}
            >
              Pending Orders
            </button>
            <button
              className={`poh-tab ${activeTab === "completed" ? "poh-tab-active" : ""}`}
              onClick={() => { setActiveTab("completed"); setSearchTerm(""); }}
            >
              Completed Orders
            </button>
          </div>

          {/* CONTROLS */}
          <div className="poh-controls">
            <div className="poh-search-wrap">
              <span className="poh-search-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="#888" strokeWidth="1.5" />
                  <path d="M11 11L14 14" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className="poh-search-input"
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="poh-sort-btn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 6 }}>
                <path d="M1 3h12M3 7h8M5 11h4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Sort By
            </button>
          </div>

          {/* LIST */}
          {loading ? (
            <div className="poh-empty">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="poh-empty">No {activeTab} orders found.</div>
          ) : (
            <div className="poh-list">
              {filtered.map((order) => (
                <div
                  key={order.order_id}
                  className="poh-list-item"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="poh-item-left">
                    <div className="poh-order-id">ORDER ID XX{order.order_id}</div>
                    <div className="poh-order-sub">Ordered by: {order.customer_name}</div>
                  </div>
                  <div className="poh-item-right">
                    <div className="poh-badges">
                      <span className="poh-badge poh-badge-approved">APPROVED</span>
                      {activeTab === "completed" && (
                        <span className="poh-badge poh-badge-completed">COMPLETED</span>
                      )}
                    </div>
                    <div className="poh-order-date">
                      {activeTab === "pending"
                        ? `Date Ordered: ${order.date_ordered}`
                        : `Date Completed: ${order.completion_date}`}
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