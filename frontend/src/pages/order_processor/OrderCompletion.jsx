import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import completeIcon from "../../assets/check_white.png"
import successImage from "../../assets/check_outline_green.png";
import "./OrderCompletion.css";

export default function OrderCompletion() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionInfo, setCompletionInfo] = useState(null);

  useEffect(() => {
    apiFetch(`/api/op/order/${orderId}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load order");
        return res.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        alert("Failed to load order details");
        navigate("/order-processor/dashboard");
      })
      .finally(() => setLoading(false));

  }, [orderId, navigate]);

  const handleMarkComplete = () => {
    setShowPasswordModal(true);
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
  <p><strong>Username:</strong> ${completionInfo?.processed_by || "—"}</p>
  <p><strong>Date &amp; Time:</strong> ${completionInfo?.completion_date || "—"}</p>
</body>
</html>`;
    iframe.srcdoc = content;
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  };


  const handleConfirmComplete = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);

    try {
      const response = await apiFetch(
        `/api/op/order/${orderId}/complete/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

      const data = await response.json();
      setIsCompleted(true);
      setCompletionInfo({
        processed_by: data.processed_by,
        completion_date: data.completion_date,
      });
      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to complete order");
    } finally {
      setProcessing(false);
      setPassword("");
    }
  };

  if (loading) {
    return <div className="completion-container">Loading...</div>;
  }

  if (!order) {
    return <div className="completion-container">Order not found</div>;
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
    <div className="completion-container">
      {/* HEADER */}
      <header className="completion-header-section">
        <div className="completion-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="completion-system-title">Web Credit System</span>
        </div>
      </header>

      <main className="completion-content">
    <div className="title-action-row">
      <h1 className="completion-title">ORDER ID {order.order_id}</h1>
      {isCompleted && (
        <button className="completion-generate-btn" onClick={handleGeneratePDF}>
          Generate Order Form
        </button>
      )}
    </div>

      <p className="completion-date-submitted">
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
      <span className="meta-value">{order.phone || "—"}</span>
    </p>

    <hr className="order-detail-divider" />

      {/* Order Form */}
      <h3 className="completion-section-title">Order Form</h3>
      <div className="completion-table-wrapper">
        <table className="completion-table">
          <thead>
            <tr>
              <th className="completion-th">ITEM</th>
              <th className="completion-th">QUANTITY</th>
              <th className="completion-th">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="completion-td">{item.name}</td>
                <td className="completion-td">{item.quantity}</td>
                <td className="completion-td">₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="completion-total-label">
                TOTAL
              </td>
              <td className="completion-total-value">₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Delivery Details */}
      <h3 className="completion-section-title">Delivery Details</h3>
      <div className="completion-address-box">
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

      <p className="completion-approval-note">
        Approved by Credit Manager: <strong>{order.approved_by}</strong>
        <br />
        Date &amp; Time: {order.approval_date}
      </p>

      {isCompleted && completionInfo && (
        <p className="completion-completion-note">
          Processed and closed by Order Processor: <strong>{completionInfo.processed_by}</strong>
          <br />
          Date &amp; Time: {completionInfo.completion_date}
        </p>
      )}

      {/* Action Buttons */}
      <div className="completion-actions">
        <button
          className="completion-back-btn"
          onClick={() => navigate("/order-processor/dashboard")}
        >
          Back
        </button>
        {!isCompleted && (
          <button className="completion-complete-btn" onClick={handleMarkComplete}>
            <img src={completeIcon} alt="" className="btn-icon-img" />
            Mark as Completed
          </button>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Please enter user password to proceed.</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="modal-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmComplete();
              }}
            />
            <div className="modal-button-row">
              <button
                className="modal-cancel-btn"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="completion-complete-btn"
                onClick={handleConfirmComplete}
                disabled={processing}
              >
                {processing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
          <img
            src={successImage}
            alt="Success"
           className="success-icon-img"
         />
         <h3 className="success-title">Completed</h3>
            <p className="success-message">
              Order has been marked as completed.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                className="modal-cancel-btn"
                onClick={() => setShowSuccessModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}
