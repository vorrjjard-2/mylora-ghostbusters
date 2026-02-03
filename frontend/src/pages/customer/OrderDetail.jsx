import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Where to go when the user presses Back — honour the caller's intent,
  // default to order history if nothing was passed.
  const backTo = location.state?.from || "/orders";

  useEffect(() => {
    fetch(`http://localhost:8000/api/orders/${orderId}/`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then(setOrder)
      .catch((err) => {
        console.error(err);
        navigate(backTo);
      })
      .finally(() => setLoading(false));
  }, [orderId, navigate, backTo]);

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (!order)  return null;

  return (
    <div style={styles.container}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
      </div>

      {/* order ID + date */}
      <h1 style={styles.title}>ORDER ID XX{order.order_id}</h1>
      <p style={styles.meta}>
        <strong>DATE SUBMITTED:</strong> {order.date_submitted}
      </p>

      {/* customer info */}
      <p style={styles.meta}>
        <strong>Customer:</strong> {order.customer_name}
      </p>
      <p style={styles.meta}>
        <strong>Phone:</strong> {order.phone || "—"}
      </p>

      <hr style={styles.divider} />

      {/* order form table */}
      <h2 style={styles.subTitle}>Order Form</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ITEM</th>
              <th style={styles.th}>QUANTITY</th>
              <th style={styles.th}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i}>
                <td style={styles.td}>{item.name}</td>
                <td style={styles.td}>{item.quantity}</td>
                <td style={styles.td}>
                  ₱ {parseFloat(item.subtotal).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={styles.totalLabel}>TOTAL</td>
              <td style={styles.totalValue}>
                ₱ {parseFloat(order.total_amount).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* back button */}
      <button style={styles.backBtn} onClick={() => navigate(backTo)}>
        Back
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "580px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "1.75rem",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },

  title: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: "0 0 0.5rem",
  },
  meta: {
    fontSize: "0.95rem",
    margin: "0.25rem 0",
    color: "#333",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #ddd",
    margin: "1.25rem 0",
  },
  subTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginBottom: "0.75rem",
  },

  /* table */
  tableWrapper: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "1.75rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f5f5f5",
    padding: "0.75rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#555",
  },
  td: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #eee",
    fontSize: "0.95rem",
  },
  totalLabel: {
    padding: "0.75rem 1rem",
    fontWeight: 700,
    textAlign: "right",
    borderTop: "2px solid #333",
    color: "#333",
  },
  totalValue: {
    padding: "0.75rem 1rem",
    fontWeight: 700,
    borderTop: "2px solid #333",
    fontSize: "1rem",
  },

  /* back */
  backBtn: {
    display: "block",
    width: "100%",
    padding: "0.85rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};