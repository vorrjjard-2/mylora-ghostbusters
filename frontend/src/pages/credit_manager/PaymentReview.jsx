import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function PaymentReview() {
  const navigate = useNavigate();
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    fetch(`http://localhost:8000/api/cm/payment/${paymentId}/`, {
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
  };

  const handleConfirmAction = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(
        `http://localhost:8000/api/cm/payment/${paymentId}/${pendingAction}/`,
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
        throw new Error(errorData.error || `Failed to ${pendingAction} payment`);
      }

      setShowPasswordModal(false);
      if (pendingAction === "approve") {
        setShowSuccessModal(true);
      } else {
        alert("Payment rejected");
        navigate("/credit-manager/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || `Failed to ${pendingAction} payment`);
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
    return <div style={styles.container}>Loading...</div>;
  }

  if (!payment) {
    return <div style={styles.container}>Payment not found</div>;
  }

  const creditUtilization = payment.credit_limit
    ? ((parseFloat(payment.credit_limit) - parseFloat(payment.available_credit)) /
        parseFloat(payment.credit_limit)) *
      100
    : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.logoutBtn} onClick={() => navigate("/login")}>
          Logout
        </button>
      </div>

      {/* Title */}
      <h1 style={styles.title}>Payment Review</h1>

      {/* Customer Name */}
      <h2 style={styles.customerName}>{payment.customer_name}</h2>

      {/* Credit Balance Section */}
      <div style={styles.creditSection}>
        <h3 style={styles.sectionTitle}>Credit Balance</h3>
        <div style={styles.creditRow}>
          <span>Available Credit:</span>
          <span style={styles.creditValue}>
            ₱ {parseFloat(payment.available_credit).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {/* Progress bar */}
        <div style={styles.progressContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${creditUtilization}%`,
            }}
          />
        </div>
        <div style={styles.creditRow}>
          <span>Credit Limit:</span>
          <span style={styles.creditLimit}>
            ₱ {parseFloat(payment.credit_limit).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Outstanding Balance */}
      <div style={styles.balanceSection}>
        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>Outstanding Balance</span>
          <span style={styles.balanceAmount}>
            ₱ {parseFloat(payment.outstanding_balance).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Invoice Number</label>
        <input
          type="text"
          value={payment.inv_number || ""}
          readOnly
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Balance Paid</label>
        <input
          type="text"
          value={`₱ ${parseFloat(payment.amount_paid).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          readOnly
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Date of Payment</label>
        <input
          type="text"
          value={payment.date_paid}
          readOnly
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Proof of Payment</label>
        {payment.proof_payment_url ? (
          <div style={styles.fileDisplay}>
            <span style={styles.fileIcon}>📄</span>
            <a
              href={payment.proof_payment_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.fileLink}
            >
              {payment.proof_payment_url.split("/").pop()}
            </a>
          </div>
        ) : (
          <div style={styles.fileDisplay}>No file uploaded</div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonRow}>
        <button
          style={styles.cancelBtn}
          onClick={() => navigate("/credit-manager/dashboard")}
        >
          Cancel
        </button>
        <button
          style={styles.confirmBtn}
          onClick={() => initiateAction("approve")}
        >
          Confirm Payment
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Please enter user password to proceed.</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              style={styles.passwordInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAction();
              }}
            />
            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={handleCancelPasswordModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleConfirmAction}
                disabled={processing}
              >
                {processing ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.successTitle}>Balance payment successfully updated!</h3>
            <p style={styles.successMessage}>
              Balance payment has been confirmed and credit balance has been updated.
            </p>
            <button
              style={styles.returnBtn}
              onClick={() => navigate("/credit-manager/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 500,
  },
  logoutBtn: {
    padding: "0.5rem 1.25rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#888",
  },
  customerName: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "2rem",
  },
  creditSection: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  creditRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
  },
  creditValue: {
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  creditLimit: {
    fontSize: "0.95rem",
  },
  progressContainer: {
    width: "100%",
    height: "30px",
    background: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "0.5rem",
  },
  progressBar: {
    height: "100%",
    background: "#6a9955",
    transition: "width 0.3s ease",
  },
  balanceSection: {
    borderTop: "2px solid #000",
    paddingTop: "1rem",
    marginBottom: "2rem",
  },
  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  balanceAmount: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#b03a2e",
  },
  formGroup: {
    marginBottom: "1.5rem",
  },
  label: {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.5rem",
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    background: "#f9f9f9",
  },
  fileDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#f9f9f9",
  },
  fileIcon: {
    fontSize: "1.25rem",
  },
  fileLink: {
    color: "#1f3d1a",
    textDecoration: "none",
    fontWeight: 500,
  },
  buttonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
    marginTop: "2rem",
  },
  cancelBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  confirmBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    padding: "2rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    marginBottom: "1.5rem",
  },
  modalButtonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  modalCancelBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  modalConfirmBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  successTitle: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "1rem",
    textAlign: "center",
  },
  successMessage: {
    fontSize: "1rem",
    color: "#555",
    lineHeight: "1.6",
    marginBottom: "2rem",
    textAlign: "center",
  },
  returnBtn: {
    padding: "0.75rem 2rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
    width: "100%",
  },
};