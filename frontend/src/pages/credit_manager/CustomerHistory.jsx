import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../assets/mylora-logo.png";
import "./CustomerHistory.css";

export default function CustomerHistory() {
  const navigate = useNavigate();
  const { customerId } = useParams();
  const [customer, setCustomer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  /*  // Fetch customer details and payment history
    Promise.all([
      fetch("http://localhost:8000/api/cm/customers/", {
        credentials: "include",
      }).then((res) => res.json()),
      fetch(`http://localhost:8000/api/cm/customer/${customerId}/history/`, {
        credentials: "include",
      }).then((res) => res.json()),
    ])
      .then(([customers, historyData]) => {
        const found = customers.find((c) => c.customer_id === parseInt(customerId));
        if (!found) throw new Error("Customer not found");
        setCustomer(found);
        setHistory(historyData);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to load customer history");
        navigate("/credit-manager/adjustment");
      })
      .finally(() => setLoading(false)); */

      const mockCustomer = { // REMOVE
      customer_id: parseInt(customerId) || 1,
      name: "Juan Dela Cruz",
      available_credit: 75000.00,
      credit_limit: 100000.00,
      outstanding_balance: 25000.00,
    };

    const mockHistory = [
      {
        payment_id: 101,
        date_paid: "2024-02-15",
        inv_number: "INV-2024-001",
        amount_paid: 5000.00,
        payment_status: "VERIFIED",
        approved_by: "Admin Maria"
      },
      {
        payment_id: 102,
        date_paid: "2024-02-20",
        inv_number: "INV-2024-005",
        amount_paid: 15000.00,
        payment_status: "PENDING",
        approved_by: null
      },
      {
        payment_id: 103,
        date_paid: "2024-01-10",
        inv_number: "INV-2023-999",
        amount_paid: 2000.00,
        payment_status: "REJECTED",
        approved_by: "Admin Jose"
      }
    ];

    setCustomer(mockCustomer);
    setHistory(mockHistory);
    setLoading(false); // REMOVE
  }, [customerId, navigate]);

  if (loading) {
    return <div className="ch-container">Loading...</div>;
  }

  if (!customer) {
    return <div className="ch-container">Customer not found</div>;
  }

return (
    <div className="ch-container">
      {/* HEADER */}
      <header className="ch-header-section">
        <div className="ch-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="ch-system-title">Web Credit System</span>
        </div>
        <button className="ch-back-btn" onClick={() => navigate(`/credit-manager/customer/${customerId}`)}>
          Back
        </button>
      </header>

      <main className="ch-content">

      <h1 className="ch-title">Credit History</h1>
      <h2 className="ch-customer-name">{customer.name}</h2>

      {/* Current Balance Summary */}
      <div className="ch-summary-card">
        <div className="ch-summary-row">
          <div className="ch-summary-item">
            <div className="ch-summary-label">Available Credit</div>
            <div className="ch-summary-value">
              ₱ {parseFloat(customer.available_credit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="ch-summary-item">
            <div className="ch-summary-label">Credit Limit</div>
            <div className="ch-summary-value">
              ₱ {parseFloat(customer.credit_limit).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="ch-summary-item">
            <div className="ch-summary-label">Outstanding Balance</div>
            <div className="ch-summary-value-red">
              ₱ {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="ch-section">
        <h3 className="ch-section-title">Payment History</h3>
        {history.length === 0 ? (
          <div className="ch-empty">No payment history found</div>
        ) : (
          <div className="ch-table-wrapper">
            <table className="ch-table">
              <thead>
                <tr>
                  <th className="ch-th">Date</th>
                  <th className="ch-th">Invoice Number</th>
                  <th className="ch-th">Amount Paid</th>
                  <th className="ch-th">Status</th>
                  <th className="ch-th">Approved By</th>
                </tr>
              </thead>
              <tbody>
                {history.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td className="ch-td">{payment.date_paid}</td>
                    <td className="ch-td">{payment.inv_number || "—"}</td>
                    <td className="ch-td">
                      ₱ {parseFloat(payment.amount_paid).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="ch-td">
                      <span className={`ch-status-badge ch-status-${payment.payment_status.toLowerCase()}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                    <td className="ch-td">{payment.approved_by || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </main>
    </div>
  );
}