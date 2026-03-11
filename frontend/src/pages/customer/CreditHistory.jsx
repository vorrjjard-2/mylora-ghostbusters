import { API_BASE_URL } from "../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../../utils/logout";
import usePagination from "../../hooks/usePagination";
import Pagination from "../../components/Pagination";
import logo from "../../assets/mylora-logo.png";
import "./Dashboard.css";

export default function CreditHistory() {
  const navigate = useNavigate();
  const [creditInfo, setCreditInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/customer/dashboard/`, { credentials: "include" }).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/payments/history/`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([dashData, paymentData]) => {
        setCreditInfo(dashData.credit);
        setPayments(Array.isArray(paymentData) ? paymentData : []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const { currentPage, totalPages, paginatedData, goToPage } = usePagination(payments, 10, []);

  if (loading) return <div className="cd-container">Loading...</div>;

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusStyles = {
    PENDING: { backgroundColor: "#FFF3CD", color: "#856404" },
    VERIFIED: { backgroundColor: "#D1E7DD", color: "#0F5132" },
    REJECTED: { backgroundColor: "#F8D7DA", color: "#842029" },
  };

  return (
    <div className="cd-container">
      {/* Header */}
      <header className="cd-main-header">
        <div className="cd-brand-group">
          <img src={logo} alt="Mylora Logo" className="cd-logo-img" />
          <span className="cd-system-title">Web Credit System</span>
        </div>
        <div className="cd-header-actions">
          <button className="cd-profile-btn" onClick={() => navigate("/customer/dashboard")}>
            Dashboard
          </button>
          <button className="cd-logout-btn" onClick={() => handleLogout(navigate)}>
            Logout
          </button>
        </div>
      </header>

      <main className="cd-content">
        <h1 className="cd-title">Credit History</h1>

        {/* Credit Summary */}
        {creditInfo && (
          <div style={{
            display: "flex",
            gap: "20px",
            marginBottom: "30px",
          }}>
            <div style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Available Credit</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#1E2D1A" }}>
                ₱ {fmt(creditInfo.available_credit)}
              </div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Credit Limit</div>
              <div style={{ fontSize: "24px", fontWeight: "700" }}>
                ₱ {fmt(creditInfo.credit_limit)}
              </div>
            </div>
            <div style={{
              flex: 1,
              backgroundColor: "white",
              border: "1px solid #262626",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>Outstanding Balance</div>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#b03a2e" }}>
                ₱ {fmt(creditInfo.outstanding_balance)}
              </div>
            </div>
          </div>
        )}

        {/* Payment History Table */}
        <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "15px" }}>Payment History</h2>
        {payments.length === 0 ? (
          <p style={{ color: "#888", padding: "1rem" }}>No payment history yet.</p>
        ) : (
          <div className="cd-table-wrapper">
            <table className="cd-table">
              <thead>
                <tr>
                  <th className="cd-th">INVOICE #</th>
                  <th className="cd-th">AMOUNT PAID</th>
                  <th className="cd-th">DATE PAID</th>
                  <th className="cd-th">DATE SUBMITTED</th>
                  <th className="cd-th">STATUS</th>
                  <th className="cd-th">CONFIRMED BY</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((p) => {
                  const badge = statusStyles[p.payment_status] || { backgroundColor: "#e0e0e0", color: "#333" };
                  return (
                    <tr key={p.payment_id} className="cd-table-row">
                      <td className="cd-td">{p.inv_number || "—"}</td>
                      <td className="cd-td">₱ {fmt(p.amount_paid)}</td>
                      <td className="cd-td">{p.date_paid}</td>
                      <td className="cd-td">{p.date_submitted}</td>
                      <td className="cd-td">
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          ...badge,
                        }}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="cd-td">{p.approved_by || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => navigate("/customer/dashboard")}
            style={{
              padding: "10px 24px",
              fontSize: "16px",
              fontWeight: "600",
              border: "1px solid #262626",
              borderRadius: "8px",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
