import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import logo from "../../assets/mylora-logo.png";
import paperIcon from "../../assets/paper.png";
import clockIcon from "../../assets/clock.png";
import "../credit_manager/CustomerDetails.css";
import "./Dashboard.css";

export default function UMCustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const response = await fetch(
        `http://localhost:8000/api/um/customer/${customerId}/delete/`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account");
      }

      alert("Customer account deleted successfully");
      navigate("/upper-management/customers");
    } catch (err) {
      console.error(err);
      alert(err.message || "Operation failed");
    } finally {
      setProcessing(false);
      setPassword("");
    }
  };

  const fmt = (n) =>
    parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });

  if (loading) return <div className="cd-container">Loading...</div>;
  if (!customer) return <div className="cd-container">Customer not found</div>;

  return (
    <div className="cd-container">
      {/* Header */}
      <header className="ub-header-section">
        <div className="ub-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ub-system-title">Web Credit System</span>
        </div>
        <button className="um-logout-btn" onClick={() => navigate("/login")}>
          Logout
        </button>
      </header>

      <div className="cd-content">
        <h1 className="cd-customer-title">{customer.name}</h1>

        {/* Action Buttons */}
        <div className="cd-button-row">
          <button
            className="cd-adjust-btn"
            onClick={() => navigate(`/upper-management/customer/${customerId}/update-balance`)}
          >
            <img src={clockIcon} alt="Update" className="cd-clock-icon" />
            Update Credit Balance
          </button>
          <button
            className="cd-adjust-btn"
            onClick={() => navigate(`/upper-management/customer/${customerId}/history`)}
          >
            <img src={paperIcon} alt="History" className="cd-paper-icon" />
            View Order History
          </button>
        </div>

        {/* Credit Balance */}
        <div className="cd-section">
          <h3 className="cd-section-title">Credit Balance</h3>
          <div className="cd-balance-row">
            <span>Available Credit:</span>
            <span className="cd-balance-value">₱ {fmt(customer.available_credit)}</span>
          </div>
          <div className="cd-balance-row">
            <span>Credit Limit:</span>
            <span>₱ {fmt(customer.credit_limit)}</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="cd-outstanding-section">
          <div className="cd-outstanding-row">
            <span className="cd-outstanding-label">Outstanding Balance</span>
            <span className="cd-outstanding-amount">₱ {fmt(customer.outstanding_balance)}</span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="cd-section">
          <h3 className="cd-section-title">Contact Information</h3>
          <div className="cd-form-row">
            <div className="cd-form-group">
              <label className="cd-label">Email</label>
              <input type="text" value={customer.email || "N/A"} readOnly className="cd-input-read-only" />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Phone Number</label>
              <input type="text" value={customer.phone || "N/A"} readOnly className="cd-input-read-only" />
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="cd-section">
          <h2 className="cd-section-title">Address Details</h2>
          <div className="cd-form-group">
            <label className="cd-label">Address 1</label>
            <input type="text" value={customer.address1 || "N/A"} readOnly className="cd-input-read-only" />
          </div>
          <div className="cd-form-group">
            <label className="cd-label">Address 2</label>
            <input type="text" value={customer.address2 || "N/A"} readOnly className="cd-input-read-only" />
          </div>
          <div className="cd-form-row-triple">
            <div className="cd-form-group">
              <label className="cd-label">Barangay</label>
              <input type="text" value={customer.barangay || "N/A"} readOnly className="cd-input-read-only" />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">City</label>
              <input type="text" value={customer.city || "N/A"} readOnly className="cd-input-read-only" />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Zip Code</label>
              <input type="text" value={customer.zipcode || "N/A"} readOnly className="cd-input-read-only" />
            </div>
          </div>
        </div>

        {/* Credit Information */}
        <div className="cd-section">
          <h3 className="cd-section-title">Credit Information</h3>
          <div className="cd-form-row">
            <div className="cd-form-group">
              <label className="cd-label">Credit Term</label>
              <input type="text" value={customer.credit_term || "N/A"} readOnly className="cd-input-read-only" />
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Credit Amount</label>
              <input
                type="text"
                value={customer.credit_type ? "₱ " + parseFloat(customer.credit_type).toLocaleString("en-PH", { minimumFractionDigits: 2 }) : "N/A"}
                readOnly
                className="cd-input-read-only"
              />
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        {customer.documents && customer.documents.length > 0 && (
          <div className="cd-section">
            <h3 className="cd-section-title">Supporting Documents</h3>
            {customer.documents.map((doc, i) => (
              <div key={i} style={{ padding: "0.75rem", border: "1px solid #e0e0e0", borderRadius: "6px", background: "#f9f9f9", marginBottom: "0.5rem" }}>
                📄 {doc.name}
              </div>
            ))}
          </div>
        )}

        {/* Government Issued ID */}
        {customer.gov_id && (
          <div className="cd-section">
            <h3 className="cd-section-title">Government Issued ID</h3>
            <div style={{ padding: "0.75rem", border: "1px solid #e0e0e0", borderRadius: "6px", background: "#f9f9f9" }}>
              📄 {customer.gov_id}
            </div>
          </div>
        )}

        {/* Account Notes */}
        {customer.notes && (
          <div className="cd-section">
            <h3 className="cd-section-title">Account Notes</h3>
            <div style={{ padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "6px", background: "#f9f9f9", lineHeight: "1.6" }}>
              {customer.notes}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="cd-button-row-footer" style={{ justifyContent: "space-between" }}>
          <button
            style={{ padding: "8px 30px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 600, fontSize: "18px", cursor: "pointer" }}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </button>
          <button className="cd-back-btn" onClick={() => navigate("/upper-management/customers")}>
            Back
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h3 style={modal.title}>Delete Account</h3>
            <p style={{ fontSize: "1rem", color: "#666", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Are you sure you want to delete this customer account? This action cannot be undone.
            </p>
            <div style={modal.btnRow}>
              <button style={modal.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button style={modal.deleteBtn} onClick={() => { setShowDeleteModal(false); setShowDeletePasswordModal(true); }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Password Modal */}
      {showDeletePasswordModal && (
        <div style={modal.overlay}>
          <div style={modal.box}>
            <h3 style={modal.title}>Please enter user password to proceed.</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              style={modal.passwordInput}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirmDelete(); }}
            />
            <div style={modal.btnRow}>
              <button style={modal.cancelBtn} onClick={() => { setShowDeletePasswordModal(false); setPassword(""); }} disabled={processing}>
                Cancel
              </button>
              <button style={modal.deleteBtn} onClick={handleConfirmDelete} disabled={processing}>
                {processing ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modal = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  box: { background: "#fff", borderRadius: "8px", maxWidth: "500px", width: "90%", padding: "2rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  title: { fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem", textAlign: "center" },
  passwordInput: { width: "100%", padding: "0.75rem", border: "1px solid #ccc", borderRadius: "6px", fontSize: "1rem", boxSizing: "border-box", marginBottom: "1.5rem" },
  btnRow: { display: "flex", gap: "1rem", justifyContent: "flex-end" },
  cancelBtn: { padding: "0.75rem 2rem", background: "#fff", border: "1px solid #183112", color: "#183112", borderRadius: "6px", cursor: "pointer", fontSize: "1rem" },
  deleteBtn: { padding: "0.75rem 2rem", background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "1rem", fontWeight: 600 },
};
