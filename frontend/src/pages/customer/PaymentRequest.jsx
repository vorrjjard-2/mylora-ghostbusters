import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

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
    return <div style={styles.container}>Loading...</div>;
  }

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

      {/* Page Title */}
      <h1 style={styles.pageTitle}>Update Credit Balance</h1>

      {/* User Info */}
      <h2 style={styles.userName}>Alex Fernandez</h2>

      {/* Credit Balance Section */}
      <div style={styles.creditSection}>
        <h3 style={styles.sectionTitle}>Credit Balance</h3>
        <div style={styles.creditRow}>
          <span>Available Credit:</span>
          <span style={styles.creditValue}>
            ₱ {creditInfo ? parseFloat(creditInfo.available_credit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
        {/* Progress bar */}
        <div style={styles.progressContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: creditInfo 
                ? `${((parseFloat(creditInfo.credit_limit) - parseFloat(creditInfo.available_credit)) / parseFloat(creditInfo.credit_limit)) * 100}%`
                : '0%'
            }}
          />
        </div>
        <div style={styles.creditRow}>
          <span>Credit Limit:</span>
          <span style={styles.creditLimit}>
            ₱ {creditInfo ? parseFloat(creditInfo.credit_limit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </div>

      {/* Outstanding Balance */}
      <div style={styles.balanceSection}>
        <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>Outstanding Balance</span>
          <span style={styles.balanceAmount}>
            ₱ {creditInfo ? parseFloat(creditInfo.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Invoice Number</label>
          <input
            type="text"
            name="inv_number"
            value={formData.inv_number}
            onChange={handleChange}
            style={styles.input}
            placeholder="INV1234"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Balance Paid</label>
          <input
            type="number"
            name="amount_paid"
            value={formData.amount_paid}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.amount_paid ? styles.inputError : {}),
            }}
            placeholder="₱"
            step="0.01"
          />
          {errors.amount_paid && <span style={styles.error}>{errors.amount_paid}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Date of Payment</label>
          <input
            type="date"
            name="date_paid"
            value={formData.date_paid}
            onChange={handleChange}
            style={{
              ...styles.input,
              ...(errors.date_paid ? styles.inputError : {}),
            }}
          />
          {errors.date_paid && <span style={styles.error}>{errors.date_paid}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Upload Proof of Payment</label>
          <p style={styles.helpText}>
            Please make sure that uploaded image is clear.
          </p>
          <div style={styles.fileUploadBox}>
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={styles.fileInput}
              id="fileUpload"
            />
            <label htmlFor="fileUpload" style={styles.fileLabel}>
              <span style={styles.uploadIcon}>⬇</span>
              <span>Upload file here.</span>
            </label>
            {formData.proof_payment && (
              <div style={styles.fileName}>{formData.proof_payment.name}</div>
            )}
          </div>
          <p style={styles.helpText}>
            Supported formats are .jpg, .jpeg, and .png.
            <br />
            Max file size is 10mb
          </p>
          {errors.proof_payment && <span style={styles.error}>{errors.proof_payment}</span>}
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            type="button"
            onClick={handleCancel}
            style={styles.cancelBtn}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Update Balance"}
          </button>
        </div>
      </form>
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
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#888",
  },
  userName: {
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
  },
  inputError: {
    borderColor: "#dc3545",
  },
  error: {
    color: "#dc3545",
    fontSize: "0.85rem",
    marginTop: "0.25rem",
    display: "block",
  },
  helpText: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  fileUploadBox: {
    border: "2px dashed #ccc",
    borderRadius: "6px",
    padding: "2rem",
    textAlign: "center",
    marginBottom: "0.5rem",
  },
  fileInput: {
    display: "none",
  },
  fileLabel: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  uploadIcon: {
    fontSize: "2rem",
  },
  fileName: {
    marginTop: "1rem",
    color: "#1f3d1a",
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
};