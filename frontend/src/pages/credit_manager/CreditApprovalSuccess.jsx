import { useParams, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CreditApprovalSuccess.css";

export default function CreditApprovalSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();


  const mockData = { // REMOVE
    available_credit: 1250.00,
    credit_limit: 50000.00,
    outstanding_balance: 48750.00,
    order: {
      customer_name: "JUAN DE LA CRUZ",
      total_amount: 18750.00,
      items: [
        { name: "Premium Rice (25kg)", quantity: 10, subtotal: 12500.00 },
        { name: "Organic Fertilizer", quantity: 5, subtotal: 6250.00 },
      ]
    }
  }; // REMOVE


  // The approve endpoint returns { order_id, order_status, available_credit, credit_limit, outstanding_balance }.
  // CreditApproval passes the original order object AND that response as location.state.

  /* const credit = location.state || {}; */ // RETURN
  const credit = (location.state && Object.keys(location.state).length > 0) ? location.state : mockData; // REMOVE
  
  const order  = credit.order  || {};   // original order snapshot (has customer_name, items, etc.)

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

return (
    <div className="success-wrap">
      {/* HEADER */}
      <header className="success-header-section">
        <div className="success-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="success-system-title">Web Credit System</span>
        </div>
        <button className="cancel-btn" onClick={() => navigate("/credit-manager/dashboard")}>
          Cancel
        </button>
      </header>

      <main className="success-content">

      {/* headline */}
      <h1 className="view-title">Order XX{orderId} has been approved!</h1>
      <p className="success-desc-id">ORDER ID XX{orderId} has been sent for processing.</p>
      <p className="success-desc">
        Customer {order.customer_name || "—"}'s credit balance has been updated.
      </p>

      <hr className="success-divider" />

      {/* order form */}
      <h2 className="success-sub-heading">Order Form</h2>
      <div className="success-table-wrap">
        <table className="success-table">
          <thead>
            <tr>
              <th className="success-th">ITEM</th>
              <th className="success-th">QUANTITY</th>
              <th className="success-th">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((it, i) => (
              <tr key={i}>
                <td className="success-td">{it.name}</td>
                <td className="success-td">{it.quantity}</td>
                <td className="success-td">₱ {fmt(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="success-total-label">TOTAL</td>
              <td className="success-total-val">₱ {fmt(order.total_amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* updated credit details */}
      <h2 className="success-sub-heading">Credit Details</h2>
      <p className="success-date-label">
        As of {new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}:
      </p>
      <div className="success-table-wrap">
        <table className="success-table">
          <thead>
            <tr>
              <th className="success-th">AVAILABLE CREDIT</th>
              <th className="success-th">CREDIT LIMIT</th>
              <th className="success-th">OUTSTANDING BALANCE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="success-td">₱ {fmt(credit.available_credit)}</td>
              <td className="success-td">₱ {fmt(credit.credit_limit)}</td>
              <td className="success-td success-outstanding-val">
                ₱ {fmt(credit.outstanding_balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Back Button */}
      <div className="success-actions">
        <button
          className="success-back-btn"
          onClick={() => navigate("/credit-manager/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
      </main>
    </div>
  );
}