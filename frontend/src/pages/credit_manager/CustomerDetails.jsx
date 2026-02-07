import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        <button
          style={styles.logoutBtn}
          onClick={() => navigate("/credit-manager/adjustment")}
        >
          Logout
        </button>
      </div>

      <div style={styles.content}>
        <h1 style={styles.customerTitle}>{customer.name}</h1>

        {/* Credit Balance Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Credit Balance</h3>
          <div style={styles.balanceRow}>
            <span>Available Credit:</span>
            <span style={styles.balanceValue}>
              ₱{" "}
              {parseFloat(customer.available_credit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div style={styles.balanceRow}>
            <span>Credit Limit:</span>
            <span>
              ₱{" "}
              {parseFloat(customer.credit_limit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

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

        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            style={styles.adjustBtn}
            onClick={() => navigate(`/credit-manager/customer/${customerId}/history`)}
          >
            📋 View Credit History
          </button>
          <button
            style={styles.adjustBtn}
            onClick={() => navigate(`/credit-manager/customer/${customerId}/update-balance`)}
          >
            ✏️ Update Credit Balance
          </button>
        </div>

        {/* Contact Information */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Contact Information</h3>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="text"
                value={customer.phone || "N/A"}
                readOnly
                style={styles.inputReadOnly}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="text"
                value={customer.email || "N/A"}
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
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#f5f5f5",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    background: "#fff",
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
  content: {
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
  },
  customerTitle: {
    fontSize: "2.5rem",
    fontWeight: 700,
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "2rem",
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
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
    marginBottom: "0",
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
  addressText: {
    lineHeight: "1.6",
    color: "#555",
  },
};