import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ProcessorOrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("completed");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/op/completed-orders/", {
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

  const filteredOrders = orders.filter((order) =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_id.toString().includes(searchTerm)
  );

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
          <div
            style={styles.sideItem}
            onClick={() => navigate("/order-processor/dashboard")}
          >
            Dashboard
          </div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>
            Order History
          </div>
        </aside>

        {/* main */}
        <main style={styles.main}>
          <h1 style={styles.greeting}>View Orders</h1>

          {/* Tabs */}
          <div style={styles.tabRow}>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "pending" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("pending")}
            >
              Pending Orders
            </button>
            <button
              style={{
                ...styles.tab,
                ...(activeTab === "completed" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("completed")}
            >
              Completed Orders
            </button>
          </div>

          {/* Search and Sort */}
          <div style={styles.controls}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button style={styles.sortBtn}>⇅ Sort By</button>
          </div>

          {/* Order List */}
          <div style={styles.list}>
            {filteredOrders.length === 0 && (
              <p style={styles.empty}>No completed orders found.</p>
            )}
            {filteredOrders.map((order) => (
              <div
                key={order.order_id}
                style={styles.listItem}
                onClick={() =>
                  navigate(`/order-processor/order/${order.order_id}/view`)
                }
              >
                <div style={styles.itemLeft}>
                  <div style={styles.listOrderId}>ORDER ID XX{order.order_id}</div>
                  <div style={styles.listSub}>Ordered by: {order.customer_name}</div>
                </div>
                <div style={styles.itemRight}>
                  <div style={styles.statusBadges}>
                    <span style={styles.statusApproved}>APPROVED</span>
                    <span style={styles.statusCompleted}>COMPLETED</span>
                  </div>
                  <div style={styles.listDate}>
                    Date Completed: {order.completion_date}
                  </div>
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

  /* tabs */
  tabRow: {
    display: "flex",
    borderBottom: "2px solid #e0e0e0",
    marginBottom: "1.5rem",
  },
  tab: {
    padding: "0.75rem 1.5rem",
    background: "none",
    border: "none",
    borderBottom: "3px solid transparent",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#888",
    marginBottom: "-2px",
  },
  tabActive: {
    color: "#1f3d1a",
    borderBottomColor: "#1f3d1a",
  },

  /* controls */
  controls: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  searchBox: {
    flex: 1,
    position: "relative",
    maxWidth: "350px",
  },
  searchIcon: {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.9rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.6rem 0.75rem 0.6rem 2.25rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  },
  sortBtn: {
    padding: "0.6rem 1.25rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
  },

  /* order list */
  list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#fff",
  },
  itemLeft: {
    flex: 1,
  },
  listOrderId: { fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem" },
  listSub: { fontSize: "0.85rem", color: "#666" },
  itemRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5rem",
  },
  statusBadges: {
    display: "flex",
    gap: "0.5rem",
  },
  statusApproved: {
    padding: "0.25rem 0.75rem",
    background: "#d4edda",
    color: "#155724",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  statusCompleted: {
    padding: "0.25rem 0.75rem",
    background: "#1f3d1a",
    color: "#fff",
    borderRadius: "4px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  listDate: { fontSize: "0.85rem", color: "#666", whiteSpace: "nowrap" },

  empty: { color: "#888", padding: "1rem 0" },
};