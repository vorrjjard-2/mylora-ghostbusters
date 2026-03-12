import { useParams, useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CreditApprovalSuccess.css";

export default function CreditRejectionSuccess() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};
  const order = state.order || {};

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
          Back
        </button>
      </header>

      <main className="success-content">
        {/* headline */}
        <h1 className="view-title" style={{ color: "#b03a2e" }}>Order {orderId} has been rejected.</h1>
        <p className="success-desc-id">ORDER ID {orderId} has been rejected.</p>
        <p className="success-desc">
          Customer {order.customer_name || "—"} has been notified of the rejection.
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
