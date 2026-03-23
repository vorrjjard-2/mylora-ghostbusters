import apiFetch from "../../utils/apiFetch";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import logo from "../../assets/mylora-logo.png";
import fileIcon from "../../assets/file.png";
import "./UpdateBalance.css";

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
  const [passwordError, setPasswordError] = useState("");

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    balance_paid: "",
    date_of_payment: "",
    payment_type: "",
    proof_of_payment: null,
  });
  const formatAsCurrency = (value) => {
    if (!value) return "";
    const number = value.toString().replace(/\D/g, "");
    if (!number) return "";
    return "₱" + Number(number).toLocaleString("en-PH");
  };

  useEffect(() => {
    // Fetch customer details
    apiFetch("/api/cm/customers/")
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

  const [formError, setFormError] = useState("");

  const handleSubmit = () => {
    if (!paymentForm.balance_paid || !paymentForm.date_of_payment) {
      setFormError("Please fill in balance paid and date of payment");
      return;
    }

    const amount = Number(paymentForm.balance_paid);
    const outstanding = parseFloat(customer.outstanding_balance);
    if (amount > outstanding) {
      setFormError(`Payment amount (₱${amount.toLocaleString("en-PH")}) exceeds outstanding balance (₱${outstanding.toLocaleString("en-PH", { minimumFractionDigits: 2 })})`);
      return;
    }

    setFormError("");
    setShowPasswordModal(true);
    setPassword("");
    setPasswordError("");
  };

  const handleConfirmUpdate = async () => {
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("balance_paid", paymentForm.balance_paid);
      formData.append("date_of_payment", paymentForm.date_of_payment);
      formData.append("payment_type", paymentForm.payment_type);
      if (paymentForm.proof_of_payment) {
        formData.append("proof_of_payment", paymentForm.proof_of_payment);
      }

      const response = await apiFetch(
        `/api/cm/customer/${customerId}/adjust-balance/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setPasswordError(errorData.error || "Failed to update balance");
        return;
      }

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setPasswordError(err.message || "Failed to update balance");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="ub-container">Loading...</div>;
  }

  if (!customer) {
    return <div className="ub-container">Customer not found</div>;
  }

return (
    <div className="ub-container">
      {/* HEADER */}
      <header className="ub-header-section">
        <div className="ub-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ub-system-title">Web Credit System</span>
        </div>
        <button className="ub-logout-btn" onClick={() => handleLogout(navigate)}>
          Logout
        </button>
      </header>

      <main className="ub-content">

      <h1 className="ub-customer-title">{customer.name}</h1>

      {/* Credit Balance Section */}
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

      {/* Outstanding Balance */}
      <div className="ub-outstanding-section">
        <div className="ub-outstanding-row">
          <span className="ub-outstanding-label">Outstanding Balance</span>
          <span className="ub-outstanding-amount">
            ₱ {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>


      {/* Payment Form */}
      <form className="ub-section" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <div className="ub-form-row">
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
            max={new Date().toISOString().split("T")[0]}
            className="ub-input"
          />
        </div>

        <div className="ub-form-group">
          <label className="ub-label">Payment Type</label>
          <select
            name="payment_type"
            value={paymentForm.payment_type}
            onChange={handleFormChange}
            className="ub-input"
          >
            <option value="">Select payment type</option>
            <option value="BANK_DEPOSIT">Bank Deposit</option>
            <option value="PALAWAN">Palawan Remittance</option>
            <option value="BRANCH_CASH">Branch Cash Payment</option>
            <option value="BRANCH_CHECK">Branch Check Payment</option>
          </select>
        </div>

      {/*}  <div className="ub-form-group">
          <label className="ub-label">Proof of Payment</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="ub-file-input"
            accept="image/*,.pdf"
          />
          {paymentForm.proof_of_payment && (
            <div className="ub-file-name">{paymentForm.proof_of_payment.name}</div>
          )}
        </div> */}

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
                  onClick={() => setPaymentForm(prev => ({ ...prev, proof_of_payment: null }))}
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
                accept=".jpg, .jpeg, .png"
                onChange={handleFileChange}
                className="ub-hidden-file-input"
              />
            </label>
          )}
        </div>



        {formError && (
          <p style={{ color: "#b03a2e", fontSize: "0.9rem", marginBottom: "10px" }}>{formError}</p>
        )}

        <div className="ub-button-row">
          <button type="button" className="ub-cancel-btn" onClick={() => navigate(`/credit-manager/customer/${customerId}/details`)}>
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
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
              placeholder="••••••••••"
              onKeyDown={(e) => e.key === "Enter" && handleConfirmUpdate()}
            />
            {passwordError && (
              <p style={{ color: "#b03a2e", fontSize: "0.85rem", marginTop: "4px" }}>{passwordError}</p>
            )}
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
            <button className="ub-return-btn" onClick={() => navigate("/credit-manager/dashboard")}>
              Return to Credit Adjustment
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}