import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "../credit_manager/CustomerDetails.css";
import "./Dashboard.css";

const STATUS_STYLES = {
  COMPLETED: { backgroundColor: "#CCE5FF", color: "#004085" },
  APPROVED:  { backgroundColor: "#D1E7DD", color: "#0F5132" },
  PENDING:   { backgroundColor: "#FFF3CD", color: "#856404" },
  REJECTED:  { backgroundColor: "#F8D7DA", color: "#842029" },
};

export default function UMCustomerHistory() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/um/customer/${customerId}/`, { credentials: "include" }).then((res) => res.json()),
      fetch(`${API_BASE_URL}/api/um/customer/${customerId}/orders/`, { credentials: "include" }).then((res) => res.json()),
    ])
      .then(([customerData, ordersData]) => {
        setCustomer(customerData);
        setOrders(ordersData);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load order history");
        navigate(`/upper-management/customer/${customerId}`);
      })
      .finally(() => setLoading(false));
  }, [customerId, navigate]);

  if (loading) return <div className="cd-container">Loading...</div>;
  if (!customer) return <div className="cd-container">Customer not found</div>;

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  return (
    <div className="cd-container">
      <header className="ub-header-section">
        <div className="ub-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ub-system-title">Web Credit System</span>
        </div>
        <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </header>

      <div className="cd-content">
        <h1 className="cd-customer-title">{customer.name}</h1>

        <div className="cd-section">
          <h3 className="cd-section-title">Order History</h3>

          {orders.length === 0 ? (
            <p style={{ color: "#888", padding: "2rem 0" }}>No orders found.</p>
          ) : (
            <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #e0e0e0" }}>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#555" }}>ORDER ID</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#555" }}>DATE ORDERED</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#555" }}>TOTAL AMOUNT</th>
                    <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600, fontSize: "14px", color: "#555" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
                    const badge = STATUS_STYLES[order.order_status] || { backgroundColor: "#e0e0e0", color: "#333" };
                    return (
                      <tr
                        key={order.order_id}
                        onClick={() => navigate(`/upper-management/customer/${customerId}/order/${order.order_id}`)}
                        className="cd-history-row"
                        style={{ borderBottom: idx < orders.length - 1 ? "1px solid #f0f0f0" : "none" }}
                      >
                        <td style={{ padding: "1rem", fontSize: "14px", fontWeight: 600 }}>{order.order_id}</td>
                        <td style={{ padding: "1rem", fontSize: "14px" }}>{order.date_ordered}</td>
                        <td style={{ padding: "1rem", fontSize: "14px" }}>₱ {fmt(order.total_amount)}</td>
                        <td style={{ padding: "1rem", fontSize: "14px" }}>
                          <span style={{ padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, ...badge }}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="cd-button-row-footer">
          <button
            className="cd-back-btn"
            onClick={() => navigate(`/upper-management/customer/${customerId}`)}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
