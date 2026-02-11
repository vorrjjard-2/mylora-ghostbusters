import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";
import logo from "../../assets/mylora-logo.png";
import "./PaymentRequest.css";

export default function PaymentRequest() {
  const navigate = useNavigate();
  const [creditInfo, setCreditInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    inv_number: "",
    amount_paid: "",
    date_paid: "",
    proof_payment: null,
  });
  
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch credit info to display on the page
    fetch("http://localhost:8000/api/customer/dashboard/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setCreditInfo(data.credit);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          proof_payment: "Only .jpg, .jpeg, and .png files are allowed",
        }));
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          proof_payment: "File size must be less than 10MB",
        }));
        return;
      }
      setFormData((prev) => ({ ...prev, proof_payment: file }));
      setErrors((prev) => ({ ...prev, proof_payment: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.amount_paid) {
      newErrors.amount_paid = "Balance paid is required";
    } else if (parseFloat(formData.amount_paid) <= 0) {
      newErrors.amount_paid = "Amount must be greater than 0";
    }
    
    if (!formData.date_paid) {
      newErrors.date_paid = "Date of payment is required";
    }
    
    if (!formData.proof_payment) {
      newErrors.proof_payment = "Proof of payment is required";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("inv_number", formData.inv_number);
      formDataToSend.append("amount_paid", formData.amount_paid);
      formDataToSend.append("date_paid", formData.date_paid);
      formDataToSend.append("proof_payment", formData.proof_payment);
      
      // Get CSRF token
      const csrfToken = getCookie("csrftoken");
      
      const response = await fetch("http://localhost:8000/api/payments/submit/", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken,
        },
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit payment");
      }
      
      // Success - navigate to success page
      navigate("/payment/success");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/customer/dashboard");
  };

  if (loading) {
    return <div className="pr-container">Loading...</div>;
  }

return (
  <div className="pr-container">
    {/* Header Section */}
    <header className="pr-main-header">
      <div className="pr-brand-group">
        <img src={logo} alt="Mylora Logo" className="pr-logo-img" />
        <span className="pr-system-title">Web Credit System</span>
      </div>
      <div className="pr-header-actions">
        <button className="pr-logout-btn" onClick={() => navigate("/login")}>
          Logout
        </button>
      </div>
    </header>

    <main className="pr-content">
      {/* User Info */}
      <h1 className="pr-user-name">Alex Fernandez</h1>

      {/* Credit Balance Section */}
      <section className="pr-credit-section">
        <h2 className="pr-section-title">Credit Balance</h2>
        
        <div className="pr-credit-header">
          <span className="pr-credit-label">Available Credit:</span>
          <span className="pr-credit-value">
            ₱ {creditInfo ? parseFloat(creditInfo.available_credit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="pr-progress-container">
          <div
            className="pr-progress-bar"
            style={{
              width: creditInfo 
                ? `${((parseFloat(creditInfo.credit_limit) - parseFloat(creditInfo.available_credit)) / parseFloat(creditInfo.credit_limit)) * 100}%`
                : '0%'
            }}
          />
        </div>

        <div className="pr-credit-footer">
          <span className="pr-limit-label">Credit Limit:</span>
          <span className="pr-limit-value">
            ₱ {creditInfo ? parseFloat(creditInfo.credit_limit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </section>

      {/* Outstanding Balance */}
      <section className="pr-balance-section">
        <div className="pr-balance-row">
          <span className="pr-balance-label">Outstanding Balance</span>
          <span className="pr-balance-amount">
            ₱ {creditInfo ? parseFloat(creditInfo.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </section>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="pr-payment-form">
        <div className="pr-form-row">
          <div className="pr-form-group">
            <label className="pr-label">Invoice Number</label>
            <input
              type="text"
              name="inv_number"
              value={formData.inv_number}
              onChange={handleChange}
              className="pr-input"
              placeholder="INV1234"
            />
          </div>

          <div className="pr-form-group">
            <label className="pr-label">Balance Paid</label>
            <div className="pr-input-with-icon">
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                className={`pr-input ${errors.amount_paid ? 'pr-input-error' : ''}`}
                placeholder="₱"
                step="0.01"
              />
            </div>
            {errors.amount_paid && <span className="pr-error">{errors.amount_paid}</span>}
          </div>
        </div>

        <div className="pr-form-group full-width">
          <label className="pr-label">Date of Payment</label>
          <input
            type="date"
            name="date_paid"
            value={formData.date_paid}
            onChange={handleChange}
            className={`pr-input ${errors.date_paid ? 'pr-input-error' : ''}`}
          />
          {errors.date_paid && <span className="pr-error">{errors.date_paid}</span>}
        </div>

        {/* Section: Upload Proof of Payment */}
        <div className="pr-form-group full-width">
          <label className="pr-label">Upload Proof of Payment</label>
          <p className="pr-help-text">Please make sure that uploaded image is clear.</p>

          {formData.proof_payment ? (
            /* File display when a file is selected */
            <div className="file-list-container">
              <div className="file-display-badge">
                <img src={fileIcon} alt="File Icon" className="custom-file-icon" />                  
                <span className="file-name">{formData.proof_payment.name}</span>
                <button 
                  type="button" 
                  className="remove-file" 
                  onClick={() => setFormData(prev => ({ ...prev, proof_payment: null }))}
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            /* Upload zone when no file is selected */
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload file here.</p>
                <small className="upload-hint">Supported formats are .jpg, .jpeg, and .png. Max file size is 10mb</small>
              </div>
              <input
                type="file"
                accept=".jpg, .jpeg, .png"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
            </label>
          )}
          {errors.proof_payment && <span className="pr-error">{errors.proof_payment}</span>}
        </div>

        {/* Action Buttons */}
        <div className="pr-form-footer">
          <button type="button" onClick={handleCancel} className="pr-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="pr-btn-submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Update Balance"}
          </button>
        </div>
      </form>
    </main>
  </div>
);
};