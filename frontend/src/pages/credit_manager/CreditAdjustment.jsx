import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../../utils/csrf";

export default function CreditAdjustment() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);

  // Adjustment form
  const [adjustmentForm, setAdjustmentForm] = useState({
    invoice_number: "",
    balance_paid: "",
    date_of_payment: "",
    proof_of_payment: null,
  });

  useEffect(() => {
    // Fetch all customers with credit accounts
    fetch("http://localhost:8000/api/cm/customers/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then(setCustomers)
      .catch((err) => {
        console.error(err);
        alert("Failed to load customers");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setAdjustmentForm({
      invoice_number: "",
      balance_paid: "",
      date_of_payment: "",
      proof_of_payment: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAdjustmentForm((prev) => ({ ...prev, proof_of_payment: e.target.files[0] }));
  };

  const handleSubmit = () => {
    if (!adjustmentForm.balance_paid || !adjustmentForm.date_of_payment) {
      alert("Please fill in balance paid and date of payment");
      return;
    }

    setShowPasswordModal(true);
  };

  const handleConfirmAdjustment = async () => {
    if (!password) {
      alert("Please enter your password");
      return;
    }

    setProcessing(true);
    const csrfToken = getCookie("csrftoken");

    try {
      const formData = new FormData();
      formData.append("password", password);
      formData.append("invoice_number", adjustmentForm.invoice_number);
      formData.append("balance_paid", adjustmentForm.balance_paid);
      formData.append("date_of_payment", adjustmentForm.date_of_payment);
      if (adjustmentForm.proof_of_payment) {
        formData.append("proof_of_payment", adjustmentForm.proof_of_payment);
      }

      const response = await fetch(
        `http://localhost:8000/api/cm/customer/${selectedCustomer.customer_id}/adjust-balance/`,
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
        throw new Error(errorData.error || "Failed to adjust balance");
      }

      // Update customer in list
      const updatedCustomer = await response.json();
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer_id === selectedCustomer.customer_id ? updatedCustomer.customer : c
        )
      );
      setSelectedCustomer(updatedCustomer.customer);

      setShowPasswordModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to adjust balance");
    } finally {
      setProcessing(false);
      setPassword("");
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button style={styles.logoutBtn} onClick={() => navigate("/credit-manager/dashboard")}>
          Logout
        </button>
      </div>

      <div style={styles.body}>
        {/* Sidebar - Customer List */}
        <aside style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Credit Customers:</h2>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.customerList}>
            {filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                style={{
                  ...styles.customerItem,
                  ...(selectedCustomer?.customer_id === customer.customer_id
                    ? styles.customerItemActive
                    : {}),
                }}
                onClick={() => handleCustomerSelect(customer)}
              >
                <div style={styles.customerName}>{customer.name}</div>
                <div style={styles.customerBalance}>
                  <div style={styles.balanceLabel}>Credit Limit</div>
                  <div>₱ {parseFloat(customer.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</div>
                  <div style={styles.balanceLabel}>Outstanding Balance</div>
                  <div style={{ color: "#b03a2e", fontWeight: 600 }}>
                    ₱ {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            ))}
            {filteredCustomers.length === 0 && (
              <div style={styles.empty}>No customers found</div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          {!selectedCustomer ? (
            <div style={styles.placeholder}>
              <h1>Credit Adjustment</h1>
              <p>Select a customer from the list to adjust their balance</p>
            </div>
          ) : (
            <>
              <h1 style={styles.customerTitle}>{selectedCustomer.name}</h1>

              {/* Credit Balance Section */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Credit Balance</h3>
                <div style={styles.balanceRow}>
                  <span>Available Credit:</span>
                  <span style={styles.balanceValue}>
                    ₱ {parseFloat(selectedCustomer.available_credit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={styles.balanceRow}>
                  <span>Credit Limit:</span>
                  <span>
                    ₱ {parseFloat(selectedCustomer.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Outstanding Balance */}
              <div style={styles.outstandingSection}>
                <div style={styles.outstandingRow}>
                  <span style={styles.outstandingLabel}>Outstanding Balance</span>
                  <span style={styles.outstandingAmount}>
                    ₱ {parseFloat(selectedCustomer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Adjustment Buttons */}
              <div style={styles.buttonRow}>
                <button
                  style={styles.adjustBtn}
                  onClick={() => navigate(`/credit-manager/customer/${selectedCustomer.customer_id}/history`)}
                >
                  📋 View Credit History
                </button>
                <button style={styles.adjustBtn}>✏️ Adjust Balance</button>
              </div>

              {/* Contact Information */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Contact Information</h3>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone Number</label>
                    <input
                      type="text"
                      value={selectedCustomer.phone || "N/A"}
                      readOnly
                      style={styles.inputReadOnly}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="text"
                      value={selectedCustomer.email || "N/A"}
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
                  {selectedCustomer.address1 && <div>{selectedCustomer.address1}</div>}
                  {selectedCustomer.address2 && <div>{selectedCustomer.address2}</div>}
                  {selectedCustomer.barangay && selectedCustomer.city && (
                    <div>
                      {selectedCustomer.barangay}, {selectedCustomer.city}{" "}
                      {selectedCustomer.zipcode}
                    </div>
                  )}
                  {!selectedCustomer.address1 && <div>No address on file</div>}
                </div>
              </div>

              {/* Adjustment Form */}
              <div style={styles.section}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Invoice Number</label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={adjustmentForm.invoice_number}
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
                    value={adjustmentForm.balance_paid}
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
                    value={adjustmentForm.date_of_payment}
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
                  {adjustmentForm.proof_of_payment && (
                    <div style={styles.fileName}>{adjustmentForm.proof_of_payment.name}</div>
                  )}
                </div>

                <div style={styles.submitRow}>
                  <button style={styles.submitBtn} onClick={handleSubmit}>
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
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
                if (e.key === "Enter") handleConfirmAdjustment();
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
                onClick={handleConfirmAdjustment}
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
              onClick={() => {
                setShowSuccessModal(false);
                setAdjustmentForm({
                  invoice_number: "",
                  balance_paid: "",
                  date_of_payment: "",
                  proof_of_payment: null,
                });
              }}
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
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    borderBottom: "1px solid #e0e0e0",
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
  body: {
    display: "flex",
    minHeight: "calc(100vh - 70px)",
  },
  sidebar: {
    width: "350px",
    background: "#f5f5f5",
    padding: "2rem 1.5rem",
    borderRight: "1px solid #e0e0e0",
    overflowY: "auto",
  },
  sidebarTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  searchBox: {
    marginBottom: "1rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  customerList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  customerItem: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    padding: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  customerItemActive: {
    background: "#1f3d1a",
    color: "#fff",
    borderColor: "#1f3d1a",
  },
  customerName: {
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  customerBalance: {
    fontSize: "0.85rem",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.25rem",
  },
  balanceLabel: {
    opacity: 0.8,
  },
  empty: {
    textAlign: "center",
    color: "#888",
    padding: "2rem",
  },
  main: {
    flex: 1,
    padding: "2rem",
    overflowY: "auto",
  },
  placeholder: {
    textAlign: "center",
    marginTop: "4rem",
    color: "#666",
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
  buttonRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  adjustBtn: {
    padding: "0.75rem 1.5rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
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
  input: {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "1rem",
    boxSizing: "border-box",
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
  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
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