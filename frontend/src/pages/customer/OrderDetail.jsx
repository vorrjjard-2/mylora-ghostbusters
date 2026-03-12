import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./OrderDetail.css";


export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Where to go when the user presses Back — honour the caller's intent,
  // default to order history if nothing was passed.
  const backTo = location.state?.from || "/orders";

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders/${orderId}/`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        navigate(backTo);
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate, backTo]); 

  if (loading) return <div className="order-detail-container">Loading...</div>;
  if (!order)  return null;

    // FORMAT DATE
    const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
};

return (
  <div className="order-detail-container">
    {/* header */}
    <header className="order-main-header">
      <div className="order-brand-group">
        <img src={logo} alt="Mylora Logo" className="order-logo-img" />
        <span className="order-system-title">Web Credit System</span>
      </div>
    </header>

    {/* order ID + date */}
  <main className="order-content">
    <h1 className="order-detail-title">ORDER ID {order.order_id}</h1>
    <p className="order-detail-date">
      <span className="meta-label">DATE SUBMITTED:</span> 
      <span className="meta-value">{formatDate(order.date_submitted)}</span>
    </p>

    {/* customer info */}
    <p className="order-detail-customer">
      <span className="meta-label">Customer: </span> 
      <span className="meta-value">{order.customer_name}</span>
    </p>
    <p className="order-detail-phone">
      <span className="meta-label">Phone: </span> 
      <span className="meta-value">{order.phone || "—"}</span>
    </p>

    <hr className="order-detail-divider" />

    {/* order form table */}
    <h2 className="order-detail-subtitle">Order Form</h2>
    <div className="order-detail-table-wrapper">
      <table className="order-detail-table">
        <thead>
          <tr>
            <th className="order-detail-th">ITEM</th>
            <th className="order-detail-th">QUANTITY</th>
            <th className="order-detail-th">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td className="order-detail-td">{item.name}</td>
              <td className="order-detail-td">{item.quantity}</td>
              <td className="order-detail-td">
                ₱ {parseFloat(item.subtotal).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="order-detail-total-label">TOTAL</td>
            <td className="order-detail-total-value">
              ₱ {parseFloat(order.total_amount).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    {/* Credit Term & Payment Due */}
    {order.credit_term && (
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        border: "1px solid #ccc",
        borderRadius: "6px",
        padding: "0.75rem 1.25rem",
        marginTop: "1.25rem",
        fontWeight: 700,
        fontSize: "0.9rem",
      }}>
        <span>CREDIT TERM: {order.credit_term} DAYS</span>
        {order.payment_due_date && (
          <span>PAYMENT DUE: {order.payment_due_date.toUpperCase()}</span>
        )}
      </div>
    )}

    {/* back button */}
    <div className="order-actions-container">
      <button className="order-detail-back-btn" onClick={() => navigate(backTo)}>
        Back
      </button>
    </div>
    </main>
  </div>
);
};