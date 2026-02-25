import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
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

  useEffect(() => {
    fetch(`http://localhost:8000/api/op/order/${orderId}/`, {
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
        navigate("/order-processor/dashboard");
      })
      .finally(() => setLoading(false));

  }, [orderId, navigate]);

  const handleMarkComplete = () => {
    setShowPasswordModal(true);
  };


  const handleConfirmComplete = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");
  
    try {
      const response = await fetch(
        `http://localhost:8000/api/op/order/${orderId}/complete/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete order");
      }

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
      <button className="completion-complete-btn" onClick={handleMarkComplete}>
        <img 
          src={completeIcon} 
          alt="" 
          className="btn-icon-img" 
        />
         Mark as Completed
      </button>
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
        {order.shipping_address && (
          <>
            <div>{order.shipping_address}</div>
            {order.delivery_mode && <div>Delivery Mode: {order.delivery_mode}</div>}
          </>
        )}
      </div>

      <p className="completion-approval-note">
        Order approved {order.approval_date}.
        <br />
        Approved by: {order.approved_by}
      </p>

      {/* Action Buttons */}
      <div className="completion-actions">
        <button
          className="completion-back-btn"
          onClick={() => navigate("/order-processor/dashboard")}
        >
          Back
        </button>
        {/*<button className="completion-complete-btn" onClick={handleMarkComplete}>
          ⊙ Mark as Completed
        </button>*/} {/* original mark as completed button*/}
        <button
          className="completion-generate-btn">
            Generate Order Form
        </button>
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
            <button
              className="success-return-btn"
              onClick={() => navigate("/order-processor/dashboard")}
            >
              Return to dashboard
            </button>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}