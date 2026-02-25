import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CreditApproval.css";


const getCookie = (name) => {
  const v = `; ${document.cookie}`;
  const parts = v.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(";").shift() : "";
};

export default function CreditApproval() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  
  // Override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverrideSuccess, setShowOverrideSuccess] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:8000/api/cm/order/${orderId}/`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setOrder)
      .catch(() => navigate("/credit-manager/dashboard"))
      .finally(() => setLoading(false));
  }, [orderId, navigate]); 


  const needsOverride = () => {
    if (!order) return false;
    const totalAmount = parseFloat(order.total_amount);
    const availableCredit = parseFloat(order.available_credit);
    return totalAmount > availableCredit;
  };

  const postAction = async (action) => {
    // action = "approve" | "reject"
    setActing(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/cm/order/${orderId}/${action}/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Something went wrong");
        return;
      }
      const data = await res.json();

      if (action === "approve") {
        navigate(`/credit-manager/approve/${orderId}/success`, {
          state: { order, ...data },
        });
      } else {
        navigate("/credit-manager/dashboard");
      }
    } catch (e) {
      alert("Request failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const handleRequestOverride = () => {
    setShowOverrideModal(true);
    setOverrideReason("");
  };

  const submitOverrideRequest = async () => {
    if (!overrideReason.trim()) {
      alert("Please enter a reason for the override request");
      return;
    }

    setActing(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/cm/order/${orderId}/request-override/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
          },
          body: JSON.stringify({ reason: overrideReason }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to submit override request");
        return;
      }

      setShowOverrideModal(false);
      setShowOverrideSuccess(true);
    } catch (e) {
      alert("Request failed. Please try again.");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="approval-container">Loading...</div>;
  if (!order) return null;

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const requiresOverride = needsOverride();
  const exceedsBy = requiresOverride 
    ? parseFloat(order.total_amount) - parseFloat(order.available_credit)
    : 0;

  return (
    <div className="approval-container">
      {/* HEADER */}
      <header className="approval-header-section">
        <div className="approval-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="approval-system-title">Web Credit System</span>
        </div>
        <button className="cancel-btn" onClick={() => navigate("/credit-manager/dashboard")}>
          Cancel
        </button>
      </header>

      <main className="approval-content">

      <h1 className="approval-title">ORDER ID {order.order_id}</h1>

      {/* Customer Information */}
      <h2 className="approval-subtitle">Customer Information</h2>
      <div className="info-grid">
        <div className="info-group">
          <label className="info-label-">Name</label>
          <input className="info-input-name" readOnly value={order.customer_name} />
        </div>
        <div className="info-row">
          <div className="info-group">
            <label className="info-label">Phone Number</label>
            <input className="info-input" readOnly value={order.phone || "—"} />
          </div>
          <div className="info-group">
            <label className="info-label">Email</label>
            <input className="info-input" readOnly value={order.email || "—"} />
          </div>
        </div>
      </div>

      {/* Warning if override needed */}
      {requiresOverride && (
        <div className="credit-warning-box">
          <strong>WARNING!</strong>
          <br />
          ORDER {order.order_id} amounting to ₱ {fmt(order.total_amount)} is over the available
          credit limit. {order.customer_name} has insufficient credit balance.
        </div>
      )}

      {/* Order Form */}
      <h2 className="approval-subtitle">Order Form</h2>
      <div className="table-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th className="approval-th">ITEM</th>
              <th className="approval-th">QUANTITY</th>
              <th className="approval-th">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td className="approval-td">{item.name}</td>
                <td className="approval-td">{item.quantity}</td>
                <td className="approval-td">₱ {fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="total-label">TOTAL</td>
              <td className="total-value">₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="submitted-date">Order submitted on {order.date_submitted}</p>

      {/* Credit Details */}
      <h2 className="approval-subtitle">Credit Details</h2>
      <div className="table-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th className="approval-th">AVAILABLE CREDIT</th>
              <th className="approval-th">CREDIT LIMIT</th>
              <th className="approval-th">OUTSTANDING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="approval-td">₱ {fmt(order.available_credit)}</td>
              <td className="approval-td">₱ {fmt(order.credit_limit)}</td>
              <td className="approval-td" style={{ color: "#b03a2e", fontWeight: 700 }}>
                ₱ {fmt(order.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="approval-actions">
        <button
          className="reject-btn"
          disabled={acting}
          onClick={() => postAction("reject")}
        >
          Reject Order
        </button>
        {requiresOverride ? (
          <button
            className="override-trigger-btn"
            disabled={acting}
            onClick={handleRequestOverride}
          >
            Request Override
          </button>
        ) : (
          <button
            className="approve-btn"
            disabled={acting}
            onClick={() => postAction("approve")}
          >
            Approve Order
          </button>
        )}
      </div>

      {/* Override Request Modal */}
      {showOverrideModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title-warning">WARNING!</h3>
              <p className="modal-text-body">
                <span className="text-bold">ORDER {order.order_id}</span> amounting to{" "}
                <span className="text-bold">₱ {fmt(order.total_amount)}</span> is over the available 
                credit limit. {order.customer_name} has{" "}
                <span className="text-warning-bold">insufficient credit balance</span>.
              </p>
            <div className="info-group">
              <label className="info-label">Please enter reason for override:</label>
              <textarea
                className="modal-textarea"
                placeholder="Enter reason here..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="modal-button-row">
              <button
                className="reject-btn"
                onClick={() => setShowOverrideModal(false)}
                disabled={acting}
              >
                Cancel
              </button>
              <button
                className="modal-submit-btn"
                onClick={submitOverrideRequest}
                disabled={acting}
              >
                {acting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Success Modal */}
      {showOverrideSuccess && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-success-title" style={{textAlign: 'center'}}>Override request submitted.</h3>
            <p className="modal-text-body-success">
              Reason for override:
              <br />
              <strong>{overrideReason}</strong>
            </p>
            <button
              className="success-return-btn"
              onClick={() => navigate("/credit-manager/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};