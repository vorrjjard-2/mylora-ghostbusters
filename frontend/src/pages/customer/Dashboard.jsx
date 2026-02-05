import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8000/api/customer/dashboard/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        console.error(err);
        alert("Failed to load dashboard data");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  if (!data) {
    return <div style={styles.container}>Unable to load dashboard</div>;
  }

  const creditUtilization = data.credit
    ? ((parseFloat(data.credit.credit_limit) - parseFloat(data.credit.available_credit)) /
        parseFloat(data.credit.credit_limit)) *
      100
    : 0;

  const exceedsCreditLimit = data.credit
    ? parseFloat(data.credit.outstanding_balance) > parseFloat(data.credit.credit_limit)
    : false;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Hello, {data.user.name}</h1>
        </div>
        <div style={styles.headerButtons}>
          <button style={styles.button} onClick={() => navigate("/account")}>Profile</button>
          <button style={{ ...styles.button, ...styles.logoutButton }} onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </div>

      {/* Action Cards */}
      <div style={styles.actionGrid}>
        <button style={styles.actionCard} onClick={() => navigate("/orders/create")}>
          <span style={styles.actionIcon}>+</span>
          <div>
            <div style={styles.actionTitle}>Create Purchase</div>
            <div style={styles.actionTitle}>Request</div>
          </div>
        </button>

        <button style={styles.actionCard} onClick={() => navigate("/credit/update")}>
          <span style={styles.actionIcon}>⟳</span>
          <div>
            <div style={styles.actionTitle}>Update Credit</div>
            <div style={styles.actionTitle}>Balance</div>
          </div>
        </button>

        <button style={styles.actionCard} onClick={() => navigate("/orders")}>
          <span style={styles.actionIcon}>📋</span>
          <div style={styles.actionTitle}>View Order History</div>
        </button>
      </div>

      {/* Credit Balance */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Your Credit Balance</h2>
        <div style={styles.creditInfo}>
          <div style={styles.creditRow}>
            <span>Available Credit:</span>
            <span style={styles.creditValue}>
              ₱ {parseFloat(data.credit.available_credit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={styles.creditRow}>
            <span>Credit Limit:</span>
            <span style={styles.creditValue}>
              ₱ {parseFloat(data.credit.credit_limit).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${Math.min(creditUtilization, 100)}%`,
              background: exceedsCreditLimit 
                ? "linear-gradient(90deg, #c62828 0%, #e53935 100%)" 
                : "linear-gradient(90deg, #6a9955 0%, #8db873 100%)",
            }}
          />
        </div>
      </div>

      {/* Outstanding Balance */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Outstanding Balance</h2>
        <div style={styles.balanceAmount}>
          ₱ {parseFloat(data.credit.outstanding_balance).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Orders</h2>
          <button style={styles.viewAllBtn} onClick={() => navigate("/orders")}>
            View All Orders →
          </button>
        </div>
        {data.recent_orders.length === 0 ? (
          <p style={styles.noOrders}>No orders yet</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ORDER ID</th>
                <th style={styles.th}>AMOUNT</th>
                <th style={styles.th}>DATE ORDERED</th>
                <th style={styles.th}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_orders.map((order) => (
                <tr
                  key={order.order_id}
                  style={styles.tableRow}
                  onClick={() => navigate(`/orders/${order.raw_id}`, { state: { from: "/customer/dashboard" } })}
                >
                  <td style={styles.td}>{order.order_id}</td>
                  <td style={styles.td}>
                    ₱ {parseFloat(order.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={styles.td}>{order.date_ordered}</td>
                  <td style={styles.td}>
                    <span style={getStatusBadgeStyle(order.status)}>{formatStatus(order.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatStatus(status) {
  const map = {
    PENDING: "Pending Approval",
    APPROVED: "Approved",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
  };
  return map[status] || status;
}

function getStatusBadgeStyle(status) {
  const base = {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500",
  };
  switch (status) {
    case "APPROVED":
      return { ...base, background: "#d4edda", color: "#155724" };
    case "REJECTED":
      return { ...base, background: "#f8d7da", color: "#721c24" };
    case "PENDING":
      return { ...base, background: "#fff3cd", color: "#856404" };
    case "PROCESSING":
      return { ...base, background: "#cce5ff", color: "#004085" };
    case "COMPLETED":
      return { ...base, background: "#d1ecf1", color: "#0c5460" };
    case "CANCELLED":
      return { ...base, background: "#e2e3e5", color: "#383d41" };
    default:
      return { ...base, background: "#f5f5f5", color: "#333" };
  }
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: 0,
  },
  headerButtons: {
    display: "flex",
    gap: "1rem",
  },
  button: {
    padding: "0.5rem 1.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
  },
  logoutButton: {
    background: "#f5f5f5",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    marginBottom: "2rem",
  },
  actionCard: {
    background: "#1f3d1a",
    color: "white",
    padding: "2rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    textAlign: "left",
  },
  actionIcon: {
    fontSize: "2rem",
  },
  actionTitle: {
    fontSize: "1rem",
    fontWeight: "500",
  },
  section: {
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    marginBottom: "1rem",
  },
  creditInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  creditRow: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  creditValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  progressContainer: {
    width: "100%",
    height: "40px",
    background: "#e0e0e0",
    borderRadius: "4px",
    overflow: "hidden",
    position: "relative",
  },
  progressBar: {
    height: "100%",
    transition: "width 0.3s ease, background 0.3s ease",
  },
  balanceAmount: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#b03a2e",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #ccc",
  },
  th: {
    background: "#f5f5f5",
    padding: "1rem",
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    fontWeight: "600",
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #eee",
  },
  statusBadge: {
    background: "#d4edda",
    color: "#155724",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
  },
  noOrders: {
    textAlign: "center",
    color: "#666",
    padding: "2rem",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#1f3d1a",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
    padding: 0,
  },
  tableRow: {
    cursor: "pointer",
  },
};