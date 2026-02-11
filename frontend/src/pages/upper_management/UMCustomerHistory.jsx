import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function UMCustomerHistory() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:8000/api/um/customer/${customerId}/`, {
        credentials: "include",
      }).then((res) => res.json()),
      fetch(`http://localhost:8000/api/um/customer/${customerId}/orders/`, {
        credentials: "include",
      }).then((res) => res.json()),
    ])
      .then(([customerData, ordersData]) => {
        setCustomer(customerData);
        setOrders(ordersData);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load order history");
        navigate(`/upper-management/customer/${customerId}`);
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
          onClick={() => navigate(`/upper-management/customer/${customerId}`)}
        >
          Back
        </button>
      </div>

      <h1 style={styles.title}>Order History</h1>
      <h2 style={styles.customerName}>{customer.name}</h2>

      {/* Order List */}
      <div style={styles.section}>
        {orders.length === 0 ? (
          <div style={styles.empty}>No orders found</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Date Ordered</th>
                  <th style={styles.th}>Total Amount</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td style={styles.td}>XX{order.order_id}</td>
                    <td style={styles.td}>{order.date_ordered}</td>
                    <td style={styles.td}>
                      ₱{" "}
                      {parseFloat(order.total_amount).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(order.order_status === "COMPLETED"
                            ? styles.statusCompleted
                            : order.order_status === "APPROVED"
                            ? styles.statusApproved
                            : order.order_status === "PENDING"
                            ? styles.statusPending
                            : styles.statusRejected),
                        }}
                      >
                        {order.order_status}
                      </span>
                    </td>
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
    maxWidth: "1000px",
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
  section: {
    marginBottom: "2rem",
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
  statusCompleted: {
    background: "#1f3d1a",
    color: "#fff",
  },
  statusApproved: {
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