import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OrderProcessorDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/op/pending-orders/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load orders");
        return res.json();
      })
      .then(setOrders)
      .catch((err) => {
        console.error(err);
        alert("Failed to load orders");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.logoutBtn} onClick={() => navigate("/login")}>
          Logout
        </button>
      </div>

      <div style={styles.body}>
        {/* sidebar */}
        <aside style={styles.sidebar}>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>
            Dashboard
          </div>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/order-processor/history")}
          >
            Order History
          </div>
        </aside>

        {/* main */}
        <main style={styles.main}>
          <h1 style={styles.greeting}>Hello, OP1234</h1>

          {/* Summary Card */}
          <div style={styles.cardRow}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>For Processing</div>
              <div style={styles.cardCount}>{orders.length}</div>
            </div>
          </div>

          {/* Pending Orders */}
          <h2 style={styles.sectionTitle}>Pending Orders:</h2>
          <div style={styles.list}>
            {orders.length === 0 && <p style={styles.empty}>No pending orders.</p>}
            {orders.map((order) => (
              <div
                key={order.order_id}
                style={styles.listItem}
                onClick={() => navigate(`/order-processor/order/${order.order_id}`)}
              >
                <div>
                  <div style={styles.listOrderId}>ORDER ID XX{order.order_id}</div>
                  <div style={styles.listSub}>Ordered by: {order.customer_name}</div>
                </div>
                <div>
                  <div style={styles.listStatus}>{order.order_status}</div>
                  <div style={styles.listDate}>Date Ordered: {order.date_ordered}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },
  logoutBtn: {
    padding: "0.5rem 1.25rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },

  body: { display: "flex", gap: "1.5rem" },

  /* sidebar */
  sidebar: {
    width: "160px",
    minWidth: "160px",
    borderRight: "1px solid #e0e0e0",
    paddingRight: "1rem",
  },
  sideItem: {
    padding: "0.6rem 0.75rem",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: "0.25rem",
  },
  sideItemActive: { background: "#f0f0f0", fontWeight: 600, color: "#1f3d1a" },

  /* main */
  main: { flex: 1 },
  greeting: { fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" },

  /* summary card */
  cardRow: { marginBottom: "1.5rem" },
  card: {
    maxWidth: "300px",
    background: "#1f3d1a",
    color: "#fff",
    borderRadius: "8px",
    padding: "1.25rem 1.5rem",
  },
  cardLabel: { fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" },
  cardCount: { fontSize: "2.25rem", fontWeight: 700 },

  sectionTitle: { fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" },

  /* order list */
  list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "1rem 1.25rem",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#fff",
  },
  listOrderId: { fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" },
  listSub: { fontSize: "0.85rem", color: "#666" },
  listStatus: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#1f3d1a",
    marginBottom: "0.2rem",
    textAlign: "right",
  },
  listDate: { fontSize: "0.85rem", color: "#666", whiteSpace: "nowrap" },

  empty: { color: "#888", padding: "1rem 0" },
};