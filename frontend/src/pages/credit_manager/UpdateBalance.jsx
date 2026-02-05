import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function UpdateBalance() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    invoice_number: "",
    balance_paid: "",
    date_of_payment: "",
    proof_of_payment: null,
  });

  useEffect(() => {
    // Fetch customer details
    fetch("http://localhost:8000/api/cm/customers/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then((customers) => {
        const found = customers.find((c) => c.customer_id === parseInt(customerId));
        if (!found) throw new Error("Customer not found");
        setCustomer(found);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer details");
        navigate("/credit-manager/adjustment");
      })
      .finally(() => setLoading(false));
  }, [customerId, navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setPaymentForm((prev) => ({ ...prev, proof_of_payment: e.target.files[0] }));
  };

  const handleSubmit = () => {
    if (!paymentForm.balance_paid || !paymentForm.date_of_payment) {
      alert("Please fill in balance paid and date of payment");
      return;
    }

    setShowPasswordModal(true);
  };

  const handleConfirmUpdate = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("invoice_number", paymentForm.invoice_number);
      formData.append("balance_paid", paymentForm.balance_paid);
      formData.append("date_of_payment", paymentForm.date_of_payment);
      if (paymentForm.proof_of_payment) {
        formData.append("proof_of_payment", paymentForm.proof_of_payment);
      }

      const response = await fetch(
        `http://localhost:8000/api/cm/customer/${customerId}/adjust-balance/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "X-CSRFToken": csrfToken,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update balance");
      }

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to update balance");
    } finally {
      setProcessing(false);
      setPassword("");
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (!customer) {
    return <div style={styles.container}>Customer not found</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.logoutBtn} onClick={() => navigate("/credit-manager/adjustment")}>
          Logout
        </button>
      </div>

      <h1 style={styles.customerTitle}>{customer.name}</h1>

      {/* Credit Balance Section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Credit Balance</h3>
        <div style={styles.balanceRow}>
          <span>Available Credit:</span>
          <span style={styles.balanceValue}>
            ₱ {parseFloat(customer.available_credit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div style={styles.balanceRow}>
          <span>Credit Limit:</span>
          <span>
            ₱ {parseFloat(customer.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Outstanding Balance */}
      <div style={styles.outstandingSection}>
        <div style={styles.outstandingRow}>
          <span style={styles.outstandingLabel}>Outstanding Balance</span>
          <span style={styles.outstandingAmount}>
            ₱ {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <div style={styles.section}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Invoice Number</label>
          <input
            type="text"
            name="invoice_number"
            value={paymentForm.invoice_number}
            onChange={handleFormChange}
            style={styles.input}
            placeholder="Enter invoice number"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Balance Paid</label>
          <input
            type="number"
            name="balance_paid"
            value={paymentForm.balance_paid}
            onChange={handleFormChange}
            style={styles.input}
            placeholder="₱ 0.00"
            step="0.01"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date of Payment</label>
          <input
            type="date"
            name="date_of_payment"
            value={paymentForm.date_of_payment}
            onChange={handleFormChange}
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Proof of Payment</label>
          <input
            type="file"
            onChange={handleFileChange}
            style={styles.fileInput}
            accept="image/*,.pdf"
          />
          {paymentForm.proof_of_payment && (
            <div style={styles.fileName}>{paymentForm.proof_of_payment.name}</div>
          )}
        </div>

        <div style={styles.buttonRow}>
          <button 
            style={styles.cancelBtn} 
            onClick={() => navigate("/credit-manager/adjustment")}
          >
            Cancel
          </button>
          <button style={styles.submitBtn} onClick={handleSubmit}>
            Save
          </button>
        </div>
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
                if (e.key === "Enter") handleConfirmUpdate();
              }}
            />
            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                style={styles.modalConfirmBtn}
                onClick={handleConfirmUpdate}
                disabled={processing}
              >
                {processing ? "Processing..." : "Update Balance"}
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
            <button
              style={styles.returnBtn}
              onClick={() => navigate("/credit-manager/adjustment")}
            >
              Return to Credit Adjustment
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
  customerTitle: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
    fontSize: "0.95rem",
  },
  balanceValue: {
    fontSize: "1.25rem",
    fontWeight: 600,
  },
  outstandingSection: {
    borderTop: "2px solid #000",
    borderBottom: "2px solid #000",
    padding: "1rem 0",
    marginBottom: "2rem",
  },
  outstandingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  outstandingLabel: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  outstandingAmount: {
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
    fontSize: "0.9rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  fileInput: {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
  },
  fileName: {
    marginTop: "0.5rem",
    fontSize: "0.85rem",
    color: "#666",
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
  submitBtn: {
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