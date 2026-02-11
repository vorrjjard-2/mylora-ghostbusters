import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function UMCustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "payment" or "delete"
  
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    invoice_number: "",
    balance_paid: "",
    date_of_payment: "",
    proof_of_payment: null,
  });

  useEffect(() => {
    fetch(`http://localhost:8000/api/um/customer/${customerId}/`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customer");
        return res.json();
      })
      .then(setCustomer)
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer details");
        navigate("/upper-management/customers");
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

  const handleUpdateBalance = () => {
    if (!paymentForm.balance_paid || !paymentForm.date_of_payment) {
      alert("Please fill in balance paid and date of payment");
      return;
    }
    setShowPaymentModal(false);
    setActionType("payment");
    setShowPasswordModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    setActionType("delete");
    setShowDeletePasswordModal(true);
  };

  const handleConfirmAction = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      if (actionType === "payment") {
        // Submit payment
        const formData = new FormData();
        formData.append("password", password);
        formData.append("invoice_number", paymentForm.invoice_number);
        formData.append("balance_paid", paymentForm.balance_paid);
        formData.append("date_of_payment", paymentForm.date_of_payment);
        if (paymentForm.proof_of_payment) {
          formData.append("proof_of_payment", paymentForm.proof_of_payment);
        }

        const response = await fetch(
          `http://localhost:8000/api/um/customer/${customerId}/update-balance/`,
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

        const updatedData = await response.json();
        setCustomer(updatedData.customer);

        setShowPasswordModal(false);
        setShowSuccessModal(true);
        setPaymentForm({
          invoice_number: "",
          balance_paid: "",
          date_of_payment: "",
          proof_of_payment: null,
        });
      } else if (actionType === "delete") {
        // Delete account
        const response = await fetch(
          `http://localhost:8000/api/um/customer/${customerId}/delete/`,
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
          throw new Error(errorData.error || "Failed to delete account");
        }

        // Navigate back to customer list
        alert("Customer account deleted successfully");
        navigate("/upper-management/customers");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Operation failed");
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
        <button style={styles.logoutBtn} onClick={() => navigate("/upper-management/customers")}>
          Logout
        </button>
      </div>

      <h1 style={styles.customerTitle}>{customer.name}</h1>

      {/* Outstanding Balance */}
      <div style={styles.outstandingSection}>
        <div style={styles.outstandingRow}>
          <span style={styles.outstandingLabel}>Outstanding Balance</span>
          <span style={styles.outstandingAmount}>
            ₱{" "}
            {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Available Credit and Credit Limit */}
      <div style={styles.section}>
        <div style={styles.balanceRow}>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Available Credit:</span>
            <span style={styles.balanceValue}>
              ₱{" "}
              {parseFloat(customer.available_credit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div style={styles.balanceItem}>
            <span style={styles.balanceLabel}>Credit Limit:</span>
            <span>
              ₱{" "}
              {parseFloat(customer.credit_limit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonRow}>
        <button
          style={styles.updateBtn}
          onClick={() => setShowPaymentModal(true)}
        >
          ✏️ Update Credit Balance
        </button>
        <button
          style={styles.historyBtn}
          onClick={() => navigate(`/upper-management/customer/${customerId}/history`)}
        >
          📋 View Order History
        </button>
      </div>

      {/* Contact Information */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Contact Information</h3>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="text"
              value={customer.email || "N/A"}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="text"
              value={customer.phone || "N/A"}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Address Details</h3>
        <div style={styles.addressText}>
          {customer.address1 && <div>{customer.address1}</div>}
          {customer.address2 && <div>{customer.address2}</div>}
          {customer.barangay && customer.city && (
            <div>
              {customer.barangay}, {customer.city} {customer.zipcode}
            </div>
          )}
          {!customer.address1 && <div>No address on file</div>}
        </div>
      </div>

      {/* Credit Information */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Credit Information</h3>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Credit Term</label>
            <input
              type="text"
              value={customer.credit_term || "N/A"}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Credit Type</label>
            <input
              type="text"
              value={customer.credit_type || "N/A"}
              readOnly
              style={styles.inputReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Supporting Documents */}
      {customer.documents && customer.documents.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Supporting Documents</h3>
          <div style={styles.docList}>
            {customer.documents.map((doc, i) => (
              <div key={i} style={styles.docItem}>
                📄 {doc.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Government Issued ID */}
      {customer.gov_id && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Government Issued ID</h3>
          <div style={styles.docItem}>📄 {customer.gov_id}</div>
        </div>
      )}

      {/* Account Notes */}
      {customer.notes && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Account Notes</h3>
          <div style={styles.notesBox}>{customer.notes}</div>
        </div>
      )}

      {/* Delete Button */}
      <div style={styles.deleteSection}>
        <button style={styles.deleteBtn} onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
        <button style={styles.backBtn} onClick={() => navigate("/upper-management/customers")}>
          Back
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Update Credit Balance</h3>

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

            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button style={styles.modalConfirmBtn} onClick={handleUpdateBalance}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={handleConfirmAction}
                disabled={processing}
              >
                {processing ? "Processing..." : "Update Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Delete Account</h3>
            <p style={styles.warningText}>
              Are you sure you want to delete this customer account? This action cannot be undone.
            </p>
            <div style={styles.modalButtonRow}>
              <button
                style={styles.modalCancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button style={styles.deleteConfirmBtn} onClick={handleDeleteAccount}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Password Modal */}
      {showDeletePasswordModal && (
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
                onClick={() => {
                  setShowDeletePasswordModal(false);
                  setPassword("");
                }}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                style={styles.deleteConfirmBtn}
                onClick={handleConfirmAction}
                disabled={processing}
              >
                {processing ? "Deleting..." : "Delete Account"}
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
              onClick={() => setShowSuccessModal(false)}
            >
              Close
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
    maxWidth: "900px",
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
  section: {
    marginBottom: "2rem",
  },
  balanceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  balanceItem: {
    display: "flex",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontWeight: 600,
  },
  balanceValue: {
    fontSize: "1.1rem",
    fontWeight: 600,
  },
  buttonRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  updateBtn: {
    padding: "0.75rem 1.5rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  historyBtn: {
    padding: "0.75rem 1.5rem",
    background: "#fff",
    color: "#1f3d1a",
    border: "2px solid #1f3d1a",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
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
  inputReadOnly: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
    background: "#f5f5f5",
    color: "#666",
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
  addressText: {
    lineHeight: "1.6",
    color: "#555",
  },
  docList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  docItem: {
    padding: "0.75rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    background: "#f9f9f9",
  },
  notesBox: {
    padding: "1rem",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    background: "#f9f9f9",
    lineHeight: "1.6",
  },
  deleteSection: {
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    paddingTop: "2rem",
    borderTop: "2px solid #e0e0e0",
  },
  deleteBtn: {
    padding: "0.75rem 2rem",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  backBtn: {
    padding: "0.75rem 2rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
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
  deleteConfirmBtn: {
    padding: "0.75rem 2rem",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  warningText: {
    fontSize: "1rem",
    color: "#666",
    marginBottom: "1.5rem",
    lineHeight: "1.6",
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