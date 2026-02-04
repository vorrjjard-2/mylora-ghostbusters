import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreditManagerDashboard() {
  const navigate = useNavigate();

  // data
  const [creditData, setCreditData] = useState(null);       // from /api/cm/pending-orders/
  const [payments, setPayments]     = useState([]);         // from /api/cm/pending-payments/
  const [loading, setLoading]       = useState(true);

  // UI
  const [activeTab, setActiveTab] = useState("dashboard");

  /* ── fetch both lists in parallel ── */
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/cm/pending-orders/",  { credentials: "include" }).then((r) => r.json()),
      fetch("http://localhost:8000/api/cm/pending-payments/", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([cd, pm]) => {
        setCreditData(cd);
        setPayments(pm);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.container}>Loading...</div>;

  /* ── shared sub-renderers ── */
  const CreditList = () => (
    <div style={styles.list}>
      {creditData?.pending_orders.length === 0 && (
        <p style={styles.empty}>No pending orders.</p>
      )}
      {creditData?.pending_orders.map((order) => (
        <div
          key={order.order_id}
          style={styles.listItem}
          onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
        >
          <div>
            <div style={styles.listOrderId}>ORDER ID XX{order.order_id}</div>
            <div style={styles.listSub}>Ordered by: {order.customer_name}</div>
          </div>
          <div style={styles.listDate}>Date Ordered: {order.date_ordered}</div>
        </div>
      ))}
    </div>
  );

  const PaymentList = () => (
    <div style={styles.list}>
      {payments.length === 0 && (
        <p style={styles.empty}>No pending payments.</p>
      )}
      {payments.map((p) => (
        <div
          key={p.payment_id}
          style={styles.listItem}
          onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
        >
          <div>
            <div style={styles.listOrderId}>{p.customer_name}</div>
            <div style={styles.listSub}>Amount paid: ₱ {fmt(p.amount_paid)}</div>
          </div>
          <div style={styles.listDate}>Date Paid: {p.date_paid}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={styles.container}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.logoutBtn} onClick={() => navigate("/login")}>Logout</button>
      </div>

      <div style={styles.body}>
        {/* sidebar */}
        <aside style={styles.sidebar}>
          <div
            style={{ ...styles.sideItem, ...(activeTab === "dashboard" ? styles.sideItemActive : {}) }}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </div>
          <div
            style={{ ...styles.sideItem, ...(activeTab === "credit" ? styles.sideItemActive : {}) }}
            onClick={() => setActiveTab("credit")}
          >
            Credit Approval
          </div>
          <div
            style={{ ...styles.sideItem, ...(activeTab === "payment" ? styles.sideItemActive : {}) }}
            onClick={() => setActiveTab("payment")}
          >
            Payment Review
          </div>
          <div
            style={{ ...styles.sideItem, ...(activeTab === "adjustment" ? styles.sideItemActive : {}) }}
            onClick={() => setActiveTab("adjustment")}
          >
            Credit Adjustment
          </div>
        </aside>

        {/* main */}
        <main style={styles.main}>
          <h1 style={styles.greeting}>Hello, CM</h1>

          {/* summary cards — always visible */}
          <div style={styles.cardRow}>
            <div style={styles.card}>
              <div style={styles.cardLabel}>Pending Credit Approval</div>
              <div style={styles.cardCount}>{creditData?.pending_credit_count ?? 0}</div>
            </div>
            <div style={styles.cardOutline}>
              <div style={styles.cardLabel}>Pending Payment Review</div>
              <div style={styles.cardCount}>{creditData?.pending_payment_count ?? 0}</div>
            </div>
          </div>

          {/* ── Dashboard view: both tabs side by side ── */}
          {activeTab === "dashboard" && (
            <>
              <div style={styles.tabRow}>
                <span style={styles.tabHeading}>Pending Credit Approval</span>
                <span style={styles.tabHeading}>Pending Payment Review</span>
              </div>
              <div style={styles.twoCol}>
                <div style={styles.col}><CreditList /></div>
                <div style={styles.col}><PaymentList /></div>
              </div>
            </>
          )}

          {/* ── Credit Approval view ── */}
          {activeTab === "credit" && (
            <>
              <div style={styles.tabRow}>
                <span style={{ ...styles.tabHeading, ...styles.tabHeadingActive }}>Pending Credit Approval</span>
              </div>
              <CreditList />
            </>
          )}

          {/* ── Payment Review view ── */}
          {activeTab === "payment" && (
            <>
              <div style={styles.tabRow}>
                <span style={{ ...styles.tabHeading, ...styles.tabHeadingActive }}>Pending Payment Review</span>
              </div>
              <PaymentList />
            </>
          )}

          {/* ── Credit Adjustment — placeholder ── */}
          {activeTab === "adjustment" && (
            <p style={styles.empty}>Credit Adjustment coming soon.</p>
          )}
        </main>
      </div>
    </div>
  );
}

function fmt(n) {
  return parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const styles = {
  container: { padding: "2rem", maxWidth: "1100px", margin: "0 auto" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },
  logoutBtn: {
    padding: "0.5rem 1.25rem",
    background: "#fff", border: "1px solid #ccc", borderRadius: "6px",
    cursor: "pointer", fontSize: "0.9rem",
  },

  body: { display: "flex", gap: "1.5rem" },

  /* sidebar */
  sidebar: {
    width: "160px", minWidth: "160px",
    borderRight: "1px solid #e0e0e0",
    paddingRight: "1rem",
  },
  sideItem: {
    padding: "0.6rem 0.75rem", cursor: "pointer", borderRadius: "6px",
    fontSize: "0.9rem", color: "#555", marginBottom: "0.25rem",
  },
  sideItemActive: { background: "#f0f0f0", fontWeight: 600, color: "#1f3d1a" },

  /* main */
  main: { flex: 1 },
  greeting: { fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" },

  /* summary cards */
  cardRow: { display: "flex", gap: "1rem", marginBottom: "1.5rem" },
  card: {
    flex: 1, background: "#1f3d1a", color: "#fff",
    borderRadius: "8px", padding: "1.25rem 1.5rem",
  },
  cardOutline: {
    flex: 1, background: "#fff", color: "#333",
    border: "2px solid #333", borderRadius: "8px", padding: "1.25rem 1.5rem",
  },
  cardLabel: { fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" },
  cardCount: { fontSize: "2.25rem", fontWeight: 700 },

  /* tab headings */
  tabRow: { display: "flex", gap: "2rem", borderBottom: "2px solid #e0e0e0", marginBottom: "1rem" },
  tabHeading: {
    flex: 1, fontSize: "1rem", fontWeight: 600, color: "#888",
    paddingBottom: "0.5rem", textAlign: "center",
  },
  tabHeadingActive: { color: "#1f3d1a", borderBottom: "3px solid #1f3d1a", marginBottom: "-2px" },

  /* two-column layout for dashboard view */
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  col: {},

  /* order / payment list */
  list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  listItem: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "1rem 1.25rem", border: "1px solid #e0e0e0", borderRadius: "8px",
    cursor: "pointer", background: "#fff",
  },
  listOrderId: { fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" },
  listSub: { fontSize: "0.85rem", color: "#666" },
  listDate: { fontSize: "0.85rem", color: "#666", whiteSpace: "nowrap" },

  empty: { color: "#888", padding: "1rem 0" },
};