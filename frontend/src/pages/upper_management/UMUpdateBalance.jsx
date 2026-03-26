import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import fileIcon from "../../assets/file.png";
import "../credit_manager/UpdateBalance.css";
import "./Dashboard.css";

export default function UMUpdateBalance() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    reference_no: "",
    balance_paid: "",
    date_of_payment: "",
    proof_of_payment: null,
  });

  const formatAsCurrency = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    if (!number) return "";
    return "₱" + Number(number).toLocaleString("en-PH");
  };

  useEffect(() => {
    apiFetch(`/api/um/customer/${customerId}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customer");
        return res.json();
      })
      .then((data) => {
        if (data.is_active === false) {
          alert("This account is deactivated. Actions are disabled.");
          navigate(`/upper-management/customer/${customerId}`);
          return;
        }
        setCustomer(data);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer details");
        navigate(`/upper-management/customer/${customerId}`);
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

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("reference_no", paymentForm.reference_no);
      formData.append("balance_paid", paymentForm.balance_paid);
      formData.append("date_of_payment", paymentForm.date_of_payment);
      if (paymentForm.proof_of_payment) {
        formData.append("proof_of_payment", paymentForm.proof_of_payment);
      }

      const response = await apiFetch(
        `/api/um/customer/${customerId}/update-balance/`,
        {
          method: "POST",
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

  if (loading) return <div className="ub-container">Loading...</div>;
  if (!customer) return <div className="ub-container">Customer not found</div>;

  return (
    <div className="ub-container">
      <header className="ub-header-section">
        <div className="ub-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ub-system-title">Web Credit System</span>
        </div>
        <button className="um-logout-btn" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </header>

      <main className="ub-content">
        <h1 className="ub-customer-title">{customer.name}</h1>

        <section className="ub-section">
          <h3 className="ub-section-title">Credit Balance</h3>
          <div className="ub-balance-row">
            <span>Available Credit:</span>
            <span className="ub-balance-value">
              ₱ {parseFloat(customer.available_credit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="ub-balance-row">
            <span>Credit Limit:</span>
            <span>
              ₱ {parseFloat(customer.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        <div className="ub-outstanding-section">
          <div className="ub-outstanding-row">
            <span className="ub-outstanding-label">Outstanding Balance</span>
            <span className="ub-outstanding-amount">
              ₱ {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <form className="ub-section" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="ub-form-row">
            <div className="ub-form-group">
              <label className="ub-label">Reference No.</label>
              <input
                type="text"
                name="reference_no"
                value={paymentForm.reference_no}
                onChange={handleFormChange}
                className="ub-input"
                placeholder="Enter reference number"
              />
            </div>
            <div className="ub-form-group">
              <label className="ub-label">Balance Paid</label>
              <input
                type="text"
                name="balance_paid"
                value={formatAsCurrency(paymentForm.balance_paid)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  setPaymentForm((prev) => ({ ...prev, balance_paid: raw }));
                }}
                className="ub-input"
                placeholder="₱0"
              />
            </div>
          </div>

          <div className="ub-form-group">
            <label className="ub-label">Date of Payment</label>
            <input
              type="date"
              name="date_of_payment"
              value={paymentForm.date_of_payment}
              onChange={handleFormChange}
              className="ub-input"
            />
          </div>

          <div className="ub-form-group full-width">
            <label className="ub-label">Proof of Payment</label>
            <p className="ub-id-hint-text">Please make sure that uploaded image is clear.</p>
            {paymentForm.proof_of_payment ? (
              <div className="ub-file-list-container">
                <div className="ub-file-display-badge">
                  <img src={fileIcon} alt="File Icon" className="ub-custom-file-icon" />
                  <span className="ub-file-name">{paymentForm.proof_of_payment.name}</span>
                  <button
                    type="button"
                    className="ub-remove-file"
                    onClick={() => setPaymentForm((prev) => ({ ...prev, proof_of_payment: null }))}
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <label className="ub-upload-zone">
                <div className="ub-upload-content">
                  <p className="ub-upload-text">↑ Upload file here.</p>
                  <small className="ub-upload-hint">Supported formats are .jpg, .jpeg, and .png. Max file size is 10mb</small>
                </div>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="ub-hidden-file-input"
                />
              </label>
            )}
          </div>

          <div className="ub-button-row">
            <button
              type="button"
              className="ub-cancel-btn"
              onClick={() => navigate(`/upper-management/customer/${customerId}`)}
            >
              Cancel
            </button>
            <button type="submit" className="ub-submit-btn">
              Update Balance
            </button>
          </div>
        </form>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <h3 className="ub-modal-title">Please enter user password to proceed.</h3>
              <input
                type="password"
                className="ub-password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleConfirmUpdate()}
              />
              <div className="ub-modal-button-row">
                <button className="ub-modal-cancel-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button className="ub-modal-confirm-btn" onClick={handleConfirmUpdate} disabled={processing}>
                  {processing ? "Processing..." : "Update Balance"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="ub-modal-overlay">
            <div className="ub-modal">
              <h3 className="ub-success-title">Balance payment successfully updated!</h3>
              <button
                className="ub-return-btn"
                onClick={() => navigate(`/upper-management/customer/${customerId}`)}
              >
                Return to Customer Profile
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
