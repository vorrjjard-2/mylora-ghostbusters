import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./ProcessorOrderView.css";


export default function ProcessorOrderView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/op/order/${orderId}/view/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load order");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        alert("Failed to load order details");
        navigate("/order-processor/history");
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate]);

  if (loading) {
    return <div className="view-container">Loading...</div>;
  }

  if (!order) {
    return <div className="view-container">Order not found</div>;
  }

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};


  return (
    <div className="view-container">
      {/* HEADER */}
      <header className="view-header-section">
        <div className="view-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="view-system-title">Web Credit System</span>
        </div>
      </header>

    <main className="view-content">

      <h1 className="view-title">ORDER ID XX{order.order_id}</h1>
      <p className="view-date-submitted">
        <span className="meta-label">DATE SUBMITTED:</span> 
        <span className="meta-value">{formatDate(order.date_submitted)}</span>
      </p>

    {/* Customer Info */}
    <p className="order-detail-customer">
      <span className="meta-label">Customer: </span> 
      <span className="meta-value">{order.customer_name}</span>
    </p>
    <p className="order-detail-phone">
      <span className="meta-label">Phone: </span> 
      <span className="meta-value">{order.phone || "N/A"}</span>
    </p>

    <hr className="order-detail-divider" />

      {/* Order Form */}
      <h3 className="view-section-title">Order Form</h3>
      <div className="view-table-wrapper">
        <table className="view-table">
          <thead>
            <tr>
              <th className="view-th">ITEM</th>
              <th className="view-th">QUANTITY</th>
              <th className="view-th">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="view-td">{item.name}</td>
                <td className="view-td">{item.quantity}</td>
                <td className="view-td">₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="view-total-label">
                TOTAL
              </td>
              <td className="view-total-value">₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delivery Details */}
      <h3 className="view-section-title">Delivery Details</h3>
      <div className="view-address-box">
        {order.shipping_address && (
          <>
            <div>{order.shipping_address}</div>
            {order.delivery_mode && <div>Delivery Mode: {order.delivery_mode}</div>}
          </>
        )}
      </div>

      <p className="view-approval-note">
        Order approved {order.approval_date}.
        <br />
        Approved by: {order.approved_by}
      </p>

      <p className="view-completion-note">
        Order processed and closed {order.completion_date}.
        <br />
        Processed by: {order.processed_by}
      </p>

      {/* Back Button */}
      <div className="view-actions">
        <button
          className="view-back-btn"
          onClick={() => navigate("/order-processor/history")}
        >
          Back
        </button>
      </div>
      </main>
    </div>
  );
};