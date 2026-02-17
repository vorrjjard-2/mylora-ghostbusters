import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function CustomerHistory() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch customer details and payment history
    Promise.all([
      fetch("http://localhost:8000/api/cm/customers/", {
        credentials: "include",
      }).then((res) => res.json()),
      fetch(`http://localhost:8000/api/cm/customer/${customerId}/history/`, {
        credentials: "include",
      }).then((res) => res.json()),
    ])
      .then(([customers, historyData]) => {
        const found = customers.find((c) => c.customer_id === parseInt(customerId));
        if (!found) throw new Error("Customer not found");
        setCustomer(found);
        setHistory(historyData);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer history");
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
          style={styles.backBtn}
          onClick={() => navigate("/credit-manager/dashboard")}
        >
          Back
        </button>
      </div>

      <h1 style={styles.title}>Credit History</h1>
      <h2 style={styles.customerName}>{customer.name}</h2>

      {/* Current Balance Summary */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryRow}>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Available Credit</div>
            <div style={styles.summaryValue}>
              ₱{" "}
              {parseFloat(customer.available_credit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Credit Limit</div>
            <div style={styles.summaryValue}>
              ₱{" "}
              {parseFloat(customer.credit_limit).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
          <div style={styles.summaryItem}>
            <div style={styles.summaryLabel}>Outstanding Balance</div>
            <div style={styles.summaryValueRed}>
              ₱{" "}
              {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Payment History</h3>
        {history.length === 0 ? (
          <div style={styles.empty}>No payment history found</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Invoice Number</th>
                  <th style={styles.th}>Amount Paid</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td style={styles.td}>{payment.date_paid}</td>
                    <td style={styles.td}>{payment.inv_number || "—"}</td>
                    <td style={styles.td}>
                      ₱{" "}
                      {parseFloat(payment.amount_paid).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(payment.payment_status === "VERIFIED"
                            ? styles.statusVerified
                            : payment.payment_status === "PENDING"
                            ? styles.statusPending
                            : styles.statusRejected),
                        }}
                      >
                        {payment.payment_status}
                      </span>
                    </td>
                    <td style={styles.td}>{payment.approved_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
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
  backBtn: {
    padding: "0.5rem 1.5rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  customerName: {
    fontSize: "1.5rem",
    fontWeight: 600,
    marginBottom: "2rem",
    color: "#555",
  },
  summaryCard: {
    background: "#f9f9f9",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "2rem",
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "2rem",
  },
  summaryItem: {
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  summaryValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1f3d1a",
  },
  summaryValueRed: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#b03a2e",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    padding: "3rem",
    background: "#f9f9f9",
    borderRadius: "8px",
  },
  tableWrapper: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f5f5f5",
    padding: "1rem",
    textAlign: "left",
    borderBottom: "2px solid #e0e0e0",
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#555",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "0.95rem",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  statusVerified: {
    background: "#d4edda",
    color: "#155724",
  },
  statusPending: {
    background: "#fff3cd",
    color: "#856404",
  },
  statusRejected: {
    background: "#f8d7da",
    color: "#721c24",
  },
};