import { useParams, useNavigate, useLocation } from "react-router-dom";

export default function CreditApprovalSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // The approve endpoint returns { order_id, order_status, available_credit, credit_limit, outstanding_balance }.
  // CreditApproval passes the original order object AND that response as location.state.
  const credit = location.state || {};
  const order  = credit.order  || {};   // original order snapshot (has customer_name, items, etc.)

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={S.wrap}>
      {/* header */}
      <div style={S.header}>
        <div style={S.logo}>
          <span style={S.logoIcon}>🌾</span>
          <span style={S.logoText}>Web Credit System</span>
        </div>
        <button style={S.cancelBtn} onClick={() => navigate("/credit-manager/dashboard")}>
          Cancel
        </button>
      </div>

      {/* headline */}
      <h1 style={S.title}>Order XX{orderId} has been approved!</h1>
      <p style={S.desc}>ORDER ID XX{orderId} has been sent for processing.</p>
      <p style={S.desc}>
        Customer {order.customer_name || "—"}'s credit balance has been updated.
      </p>

      <hr style={S.divider} />

      {/* order form — re-display the items that were just approved */}
      <h2 style={S.sub}>Order Form</h2>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>ITEM</th>
              <th style={S.th}>QUANTITY</th>
              <th style={S.th}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it, i) => (
              <tr key={i}>
                <td style={S.td}>{it.name}</td>
                <td style={S.td}>{it.quantity}</td>
                <td style={S.td}>₱ {fmt(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} style={S.totalLabel}>TOTAL</td>
              <td style={S.totalVal}>₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* updated credit details — uses the fresh snapshot from the approve response */}
      <h2 style={S.sub}>Credit Details</h2>
      <p style={S.creditAs}>As of {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}:</p>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>AVAILABLE CREDIT</th>
              <th style={S.th}>CREDIT LIMIT</th>
              <th style={S.th}>OUTSTANDING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>₱ {fmt(credit.available_credit)}</td>
              <td style={S.td}>₱ {fmt(credit.credit_limit)}</td>
              <td style={{ ...S.td, color: "#b03a2e", fontWeight: 700 }}>
                ₱ {fmt(credit.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* back button */}
      <button style={S.backBtn} onClick={() => navigate("/credit-manager/dashboard")}>
        Back to Dashboard
      </button>
    </div>
  );
}

const S = {
  wrap: { padding: "2rem", maxWidth: "680px", margin: "0 auto" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem" },
  logoIcon: { fontSize: "1.5rem" },
  logoText: { fontSize: "1.25rem", fontWeight: 500 },
  cancelBtn: {
    padding: "0.6rem 1.75rem", background: "#1f3d1a", color: "#fff",
    border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600,
  },

  title: { fontSize: "1.9rem", fontWeight: 700, margin: "0 0 0.75rem" },
  desc: { fontSize: "0.95rem", color: "#444", margin: "0.25rem 0" },
  divider: { border: "none", borderTop: "1px solid #ddd", margin: "1.5rem 0" },
  sub: { fontSize: "1.1rem", fontWeight: 600, margin: "1.25rem 0 0.5rem" },
  creditAs: { fontSize: "0.87rem", color: "#666", margin: "0 0 0.6rem" },

  tableWrap: { border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", marginBottom: "0.5rem" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#f5f5f5", padding: "0.7rem 1rem", textAlign: "left",
    borderBottom: "1px solid #ccc", fontWeight: 600, fontSize: "0.82rem", color: "#555",
  },
  td: { padding: "0.7rem 1rem", borderBottom: "1px solid #eee", fontSize: "0.95rem" },
  totalLabel: {
    padding: "0.7rem 1rem", fontWeight: 700, textAlign: "right",
    borderTop: "2px solid #333", color: "#333",
  },
  totalVal: { padding: "0.7rem 1rem", fontWeight: 700, borderTop: "2px solid #333" },

  backBtn: {
    display: "block", width: "100%", padding: "0.85rem",
    background: "#1f3d1a", color: "#fff", border: "none",
    borderRadius: "6px", fontSize: "1rem", fontWeight: 600, cursor: "pointer",
    marginTop: "1.75rem",
  },
};