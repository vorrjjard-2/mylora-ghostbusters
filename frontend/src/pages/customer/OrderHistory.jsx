import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const ALL_STATUSES = ["PENDING", "APPROVED", "PROCESSING", "COMPLETED", "CANCELLED", "REJECTED"];

const STATUS_LABEL = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

function getStatusBadgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.875rem",
    fontWeight: "500",
  };
  switch (status) {
    case "APPROVED":    return { ...base, background: "#d4edda", color: "#155724" };
    case "REJECTED":    return { ...base, background: "#f8d7da", color: "#721c24" };
    case "PENDING":     return { ...base, background: "#fff3cd", color: "#856404" };
    case "PROCESSING":  return { ...base, background: "#cce5ff", color: "#004085" };
    case "COMPLETED":   return { ...base, background: "#d1ecf1", color: "#0c5460" };
    case "CANCELLED":   return { ...base, background: "#e2e3e5", color: "#383d41" };
    default:            return { ...base, background: "#f5f5f5", color: "#333" };
  }
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // filter / sort state
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");           // "asc" | "desc"
  const [sortOpen, setSortOpen] = useState(false);
  const [activeStatuses, setActiveStatuses] = useState(new Set(ALL_STATUSES));

  /* ── fetch ── */
  useEffect(() => {
    fetch("http://localhost:8000/api/orders/", { credentials: "include" })
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── toggle a single status checkbox ── */
  const toggleStatus = (s) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  /* ── select-all / clear-all helper ── */
  const allChecked = activeStatuses.size === ALL_STATUSES.length;
  const toggleAll = () =>
    setActiveStatuses(allChecked ? new Set() : new Set(ALL_STATUSES));

  /* ── derived list ── */
  const filtered = useMemo(() => {
    let list = orders.filter(
      (o) =>
        activeStatuses.has(o.order_status) &&
        (`XX${o.order_id}`.toLowerCase().includes(search.toLowerCase()) ||
          o.order_status.toLowerCase().includes(search.toLowerCase()))
    );

    list.sort((a, b) => {
      const da = new Date(a.date_ordered);
      const db = new Date(b.date_ordered);
      return sortDir === "asc" ? da - db : db - da;
    });

    return list;
  }, [orders, search, sortDir, activeStatuses]);

  /* ── render ── */
  if (loading) return <div style={styles.container}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🌾</span>
          <span style={styles.logoText}>Web Credit System</span>
        </div>
        <button style={styles.backBtn} onClick={() => navigate("/customer/dashboard")}>
          Back
        </button>
      </div>

      <h1 style={styles.title}>Your order history</h1>

      {/* toolbar: search + sort dropdown */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* sort dropdown */}
        <div style={{ position: "relative" }}>
          <button style={styles.sortBtn} onClick={() => setSortOpen(!sortOpen)}>
            ↕ Sort By
          </button>
          {sortOpen && (
            <div style={styles.sortDropdown}>
              <button
                style={{ ...styles.sortOption, fontWeight: sortDir === "desc" ? 600 : 400 }}
                onClick={() => { setSortDir("desc"); setSortOpen(false); }}
              >
                Date: Newest first
              </button>
              <button
                style={{ ...styles.sortOption, fontWeight: sortDir === "asc" ? 600 : 400 }}
                onClick={() => { setSortDir("asc"); setSortOpen(false); }}
              >
                Date: Oldest first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* status checkboxes */}
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Status:</span>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            style={styles.checkbox}
          />
          All
        </label>
        {ALL_STATUSES.map((s) => (
          <label key={s} style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={activeStatuses.has(s)}
              onChange={() => toggleStatus(s)}
              style={styles.checkbox}
            />
            {STATUS_LABEL[s]}
          </label>
        ))}
      </div>

      {/* table */}
      <div style={styles.tableWrapper}>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} style={styles.emptyCell}>No orders match your filters.</td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr
                  key={order.order_id}
                  style={styles.row}
                  onClick={() => navigate(`/orders/${order.order_id}`, { state: { from: "/orders" } })}
                >
                  <td style={styles.td}>XX{order.order_id}</td>
                  <td style={styles.td}>
                    ₱ {parseFloat(order.total_amount).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td style={styles.td}>{order.date_ordered}</td>
                  <td style={styles.td}>
                    <span style={getStatusBadgeStyle(order.order_status)}>
                      {STATUS_LABEL[order.order_status]}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "860px",
    margin: "0 auto",
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
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },

  backBtn: {
    padding: "0.6rem 1.75rem",
    background: "#1f3d1a",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
  },

  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "1.25rem",
  },

  /* toolbar */
  toolbar: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "1rem",
    alignItems: "center",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    paddingLeft: "0.6rem",
    flex: 1,
    maxWidth: "260px",
  },
  searchIcon: { fontSize: "1rem", marginRight: "0.4rem", color: "#888" },
  searchInput: {
    border: "none",
    outline: "none",
    padding: "0.6rem 0.5rem",
    fontSize: "0.95rem",
    width: "100%",
  },

  /* sort */
  sortBtn: {
    padding: "0.6rem 1rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  sortDropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    zIndex: 10,
    minWidth: "180px",
  },
  sortOption: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "0.65rem 1rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
  },

  /* status filters */
  filterBar: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.85rem",
    alignItems: "center",
    marginBottom: "1.25rem",
  },
  filterLabel: {
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#444",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.3rem",
    fontSize: "0.9rem",
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    accentColor: "#1f3d1a",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },

  /* table */
  tableWrapper: {
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f5f5f5",
    padding: "0.85rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #ccc",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#555",
  },
  row: {
    cursor: "pointer",
    transition: "background 0.15s",
  },
  td: {
    padding: "0.85rem 1rem",
    borderBottom: "1px solid #eee",
    fontSize: "0.95rem",
  },
  emptyCell: {
    textAlign: "center",
    color: "#888",
    padding: "2rem",
  },
};