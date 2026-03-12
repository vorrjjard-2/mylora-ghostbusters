import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "../order_processor/ProcessorOrderView.css";
import "./Dashboard.css";

export default function UMOrderView() {
  const { customerId, orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || `/upper-management/customer/${customerId}/history`;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/um/order/${orderId}/view/`, {
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
        navigate(`/upper-management/customer/${customerId}/history`);
      })
      .finally(() => setLoading(false));
  }, [orderId, customerId, navigate]);

  if (loading) return <div className="view-container">Loading...</div>;
  if (!order) return <div className="view-container">Order not found</div>;

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

  const handleGeneratePDF = () => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden;";
    document.body.appendChild(iframe);
    const rows = order.items.map(
      (item) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;">${item.name}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;text-align:right;">₱ ${fmt(item.subtotal)}</td>
        </tr>`
    ).join("");
    const content = `<!DOCTYPE html>
<html>
<head>
  <title>Order Form — ${order.order_id}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 48px; color: #111; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    p { margin: 4px 0; font-size: 14px; }
    .section-label { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #555; margin: 20px 0 6px 0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 16px; }
    thead tr { background: #f5f5f5; }
    th { padding: 10px 16px; text-align: left; font-weight: 600; border-bottom: 2px solid #ccc; }
    th:last-child { text-align: right; }
    tfoot td { padding: 12px 16px; font-weight: 700; border-top: 2px solid #ccc; }
    tfoot td:last-child { text-align: right; }
  </style>
</head>
<body>
  <h1>ORDER ID ${order.order_id}</h1>
  <p><strong>Customer:</strong> ${order.customer_name}</p>
  <p><strong>Phone:</strong> ${order.phone || "—"}</p>
  <p><strong>Date Submitted:</strong> ${order.date_submitted}</p>
  <hr/>
  <p class="section-label">Order Items</p>
  <table>
    <thead>
      <tr>
        <th>ITEM</th>
        <th style="text-align:center;">QUANTITY</th>
        <th style="text-align:right;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="2">TOTAL</td>
        <td>₱ ${fmt(order.total_amount)}</td>
      </tr>
    </tfoot>
  </table>
  <hr/>
  <p class="section-label">Delivery Details</p>
  <p><strong>Delivery Mode:</strong> ${order.delivery_mode || "—"}</p>
  ${order.delivery_mode === "PICKUP"
    ? `<p><strong>${order.branch_name || "—"}</strong></p><p>${order.branch_address || "—"}</p>`
    : `<p><strong>Shipping Address:</strong> ${order.shipping_address || "—"}</p>`
  }
  <hr/>
  <p class="section-label">Approved by Credit Manager</p>
  <p><strong>Username:</strong> ${order.approved_by || "—"}</p>
  <p><strong>Date &amp; Time:</strong> ${order.approval_date || "—"}</p>
  <hr/>
  <p class="section-label">Processed and Closed by Order Processor</p>
  <p><strong>Username:</strong> ${order.processed_by || "—"}</p>
  <p><strong>Date &amp; Time:</strong> ${order.completion_date || "—"}</p>

</body>
</html>`;
    iframe.srcdoc = content;
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  };

  return (
    <div className="view-container">
      <header className="view-header-section">
        <div className="view-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="view-system-title">Web Credit System</span>
        </div>
        <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </header>

      <main className="view-content">
        <h1 className="view-title">ORDER ID {order.order_id}</h1>
        <p className="view-date-submitted">
          <span className="meta-label">DATE SUBMITTED:</span>
          <span className="meta-value">{formatDate(order.date_submitted)}</span>
        </p>

        <p className="order-detail-customer">
          <span className="meta-label">Customer: </span>
          <span className="meta-value">{order.customer_name}</span>
          {!order.customer_is_active && (
            <span style={{ marginLeft: "8px", fontSize: "0.72rem", fontWeight: 600, color: "#dc3545", border: "1px solid #dc3545", borderRadius: "4px", padding: "1px 6px", verticalAlign: "middle", letterSpacing: "0.03em" }}>
              DEACTIVATED
            </span>
          )}
        </p>
        <p className="order-detail-phone">
          <span className="meta-label">Phone: </span>
          <span className="meta-value">{order.phone || "N/A"}</span>
        </p>

        <hr className="order-detail-divider" />

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
                <td colSpan={2} className="view-total-label">TOTAL</td>
                <td className="view-total-value">₱ {fmt(order.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <h3 className="view-section-title">Delivery Details</h3>
        <div className="view-address-box">
          <div>Delivery Mode: {order.delivery_mode}</div>
          {order.delivery_mode === "PICKUP" ? (
            <>
              <div><strong>{order.branch_name || "—"}</strong></div>
              <div>{order.branch_address || "—"}</div>
            </>
          ) : (
            <div>{order.shipping_address || "—"}</div>
          )}
        </div>

        {order.approved_by && (
          <p className="view-approval-note">
            Approved by Credit Manager: <strong>{order.approved_by}</strong>
            <br />
            Date &amp; Time: {order.approval_date}
          </p>
        )}

        {order.processed_by && (
          <p className="view-completion-note">
            Processed and closed by Order Processor: <strong>{order.processed_by}</strong>
            <br />
            Date &amp; Time: {order.completion_date}
          </p>
        )}


        {order.rejected_by && (
          <p className="view-rejection-note">
            Rejected by: <strong>{order.rejected_by}</strong>
            <br />
            Date &amp; Time: {order.rejection_date}
          </p>
        )}

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

        <div className="view-actions">
          <button
            className="view-back-btn"
            onClick={() => navigate(backTo)}
          >
            Back
          </button>
          <button className="view-generate-btn" onClick={handleGeneratePDF}>
            Generate Order Form
          </button>
        </div>
      </main>
    </div>
  );
}
