import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import "./PaymentReview.css";


export default function PaymentReview() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState("");
  const [rejectReasonError, setRejectReasonError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/cm/payment/${paymentId}/`, { 
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load payment");
        return res.json();
      })
      .then(setPayment)
      .catch((err) => {
        console.error(err);
        alert("Failed to load payment details");
        navigate("/credit-manager/dashboard");
      })
      .finally(() => setLoading(false));
  }, [paymentId, navigate]);

  const initiateAction = (action) => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword("");
    setPasswordError("");
    setRejectReason("");
    setRejectReasonError("");
  };

  const handleConfirmAction = async () => {
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }

    if (pendingAction === "reject") {
      if (rejectReason.trim().split(/\s+/).length < 5) {
        setRejectReasonError("Please provide at least 5 words for the rejection reason.");
        return;
      }
      setRejectReasonError("");
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    const bodyData = { password };
    if (pendingAction === "reject") {
      bodyData.rejection_reason = rejectReason;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cm/payment/${paymentId}/${pendingAction}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify(bodyData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setPasswordError(errorData.error || `Failed to ${pendingAction} payment`);
        return;
      }

      setShowPasswordModal(false);
      if (pendingAction === "approve") {
        setShowSuccessModal(true);
      } else {
        navigate("/credit-manager/dashboard");
      }
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || `Failed to ${pendingAction} payment`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPasswordModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setPendingAction(null);
  };

  if (loading) {
    return <div className="payment-review-container">Loading...</div>;
  }

  if (!payment) {
    return <div className="payment-review-container">Payment not found</div>;
  }

  const creditUtilization = payment.credit_limit
    ? ((parseFloat(payment.credit_limit) - parseFloat(payment.available_credit)) /
        parseFloat(payment.credit_limit)) *
      100
    : 0;


  return (
    <div className="payment-review-container">
      {/* HEADER */}
      <header className="payment-header-section">
        <div className="payment-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="payment-system-title">Web Credit System</span>
        </div>
        <button className="payment-logout-btn" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </header>

      <main className= "payment-content">
    
      {/*<h1 className="payment-title">Payment Review</h1>*/}
      <h2 className="payment-customer-name">{payment.customer_name}</h2>

      {/* Credit Balance Section */}
      <section className="credit-section">
        <h3 className="section-title">Credit Balance</h3>
        <div className="credit-row">
          <span>Available Credit:</span>
          <span className="credit-value">
            ₱ {parseFloat(payment.available_credit).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${creditUtilization}%` }}
          />
        </div>

        <div className="credit-row">
          <span>Credit Limit:</span>
          <span>
            ₱ {parseFloat(payment.credit_limit).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </section>

      {/* Outstanding Balance */}
      <div className="balance-section">
        <div className="balance-row">
          <span className="balance-label">Outstanding Balance</span>
          <span className="balance-amount">
            ₱ {parseFloat(payment.outstanding_balance).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Payment Form Fields */}
      <div className="payment-form-row"> 
        <div className="payment-form-group flex-1">
          <label className="payment-label">Invoice Number</label>
          <input className="payment-input" readOnly value={payment.inv_number || ""} />
        </div>

        <div className="payment-form-group flex-1">
          <label className="payment-label">Balance Paid</label>
          <div className="payment-input-with-symbol"> 
            <input 
              className="payment-input" 
              readOnly 
              value={`₱ ${parseFloat(payment.amount_paid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} 
            />
          </div>
        </div>
      </div>

      <div className="payment-form-row">
        <div className="payment-form-group flex-1">
          <label className="payment-label">Date of Payment</label>
          <input className="payment-input" readOnly value={payment.date_paid} />
        </div>

        <div className="payment-form-group flex-1">
          <label className="payment-label">Payment Type</label>
          <input className="payment-input" readOnly value={
            { BANK_DEPOSIT: "Bank Deposit", PALAWAN: "Palawan Remittance", BRANCH_CASH: "Branch Cash Payment", BRANCH_CHECK: "Branch Check Payment" }[payment.payment_type] || "N/A"
          } />
        </div>
      </div>

      <div className="payment-form-group">
        <label className="payment-label">Proof of Payment</label>
        <div className="file-display">
          {payment.proof_payment_url ? (
            <span className="file-link" onClick={() => setShowImageModal(true)} style={{ cursor: "pointer" }}>
              View Proof of Payment
            </span>
          ) : "No file uploaded"}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="payment-button-row">
        <button className="payment-cancel-btn" onClick={() => navigate("/credit-manager/dashboard")}>
          {payment.payment_status === "PENDING" ? "Cancel" : "Back"}
        </button>
        {payment.payment_status === "PENDING" && (
          <>
            <button className="payment-cancel-btn" onClick={() => initiateAction("reject")}>
              Reject Payment
            </button>
            <button className="payment-confirm-btn" onClick={() => initiateAction("approve")}>
              Confirm Payment
            </button>
          </>
        )}
      </div>

      {/* Modals remain structurally similar but use CSS classes */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            {pendingAction === "reject" && (
              <>
                <h3 className="section-title">Reason for Rejection</h3>
                <textarea
                  className="password-input"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectReasonError(""); }}
                  placeholder="Enter reason for rejection..."
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
                {rejectReasonError && (
                  <p style={{ color: "#b03a2e", fontSize: "0.85rem", marginTop: "4px" }}>{rejectReasonError}</p>
                )}
              </>
            )}
            <h3 className="section-title">Please enter user password to proceed.</h3>
            <input
              type="password"
              className="password-input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              placeholder="••••••••••"
            />
            {passwordError && (
              <p style={{ color: "#b03a2e", fontSize: "0.85rem", marginTop: "4px" }}>{passwordError}</p>
            )}
            <div className="payment-button-row">
              <button className="payment-cancel-btn" onClick={handleCancelPasswordModal}>Cancel</button>
              <button className="payment-confirm-btn" onClick={handleConfirmAction}>
                {pendingAction === "reject" ? "Reject Payment" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              style={{ position: "absolute", top: "-12px", right: "-12px", background: "#1f3d1a", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
            <img
              src={payment.proof_payment_url}
              alt="Proof of Payment"
              style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: "8px", display: "block" }}
            />
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="payment-modal">
            <h3 className="success-section-title" style={{textAlign: 'center'}}>Balance payment successfully updated!</h3>
            <p className="success-message">Balance payment has been confirmed and credit balance updated.</p>
            <button className="payment-return-btn" onClick={() => navigate("/credit-manager/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}