import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CMSidebar from "../../components/credit_manager/CMSidebar";
import logo from "../../assets/mylora-logo.png";
import "../upper_management/Dashboard.css";

export default function CreditManagerDashboard() {
  const navigate = useNavigate();
  const user = { username: "CM1234" };

  const [creditData, setCreditData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // null = dashboard view

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8000/api/cm/pending-orders/", { credentials: "include" }).then((r) => r.json()),
      fetch("http://localhost:8000/api/cm/pending-payments/", { credentials: "include" }).then((r) => r.json()),
      fetch("http://localhost:8000/api/cm/customers/", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([cd, pm, cust]) => {
        setCreditData(cd);
        setPayments(pm);
        setCustomers(cust);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="um-dashboard-wrapper">
        <header className="um-header-section">
          <div className="um-brand-group">
            <img src={logo} alt="Mylora Logo" className="mylora-logo" />
            <span className="um-system-title">Web Credit System</span>
          </div>
        </header>
        <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  function fmt(n) {
    return parseFloat(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="um-dashboard-wrapper">
      {/* HEADER */}
      <header className="um-header-section">
        <div className="um-brand-group">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
          <span className="um-system-title">Web Credit System</span>
        </div>
        <div className="um-header-actions">
          <button className="um-logout-btn" onClick={() => navigate("/login")}>
            Logout
          </button>
        </div>
      </header>

      <div className="um-dashboard-body" style={{ display: "flex", flex: 1 }}>
        <CMSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="um-dashboard-content">
          {/* WELCOME BANNER */}
          <h1 className="um-welcome-text">
            {!activeTab && `Hello, ${user.username}`}
            {(activeTab === "credit" || activeTab === "credit-all") && "Credit Approval"}
            {(activeTab === "payment" || activeTab === "payment-all") && "Payment Review"}
            {activeTab === "adjustment" && "Credit Adjustment"}
          </h1>

          {/* STAT CARDS - Only show on dashboard view */}
          {!activeTab && (
            <>
              <div className="um-stats-container">
                <div className="um-stat-card">
                  <span className="um-stat-label">Pending Credit Approval</span>
                  <span className="um-stat-number">{creditData?.pending_credit_count ?? 0}</span>
                </div>
                <div className="um-stat-card">
                  <span className="um-stat-label">Pending Payment Review</span>
                  <span className="um-stat-number">{creditData?.pending_payment_count ?? 0}</span>
                </div>
              </div>

              {/* Two-column layout for dashboard */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "30px" }}>
                {/* Left Column - Credit Approval */}
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px", borderBottom: "2px solid #262626", paddingBottom: "10px" }}>
                    Pending Credit Approval
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {creditData?.pending_orders.length === 0 && (
                      <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
                    )}
                    {creditData?.pending_orders.map((order) => (
                      <div
                        key={order.order_id}
                        className="um-request-item"
                        onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="um-request-info">
                          <div className="um-request-id">ORDER ID XX{order.order_id}</div>
                          <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                        </div>
                        <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column - Payment Review */}
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "20px", borderBottom: "2px solid #262626", paddingBottom: "10px" }}>
                    Pending Payment Review
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {payments.length === 0 && (
                      <p style={{ color: "#888", padding: "1rem" }}>No pending payments.</p>
                    )}
                    {payments.map((p) => (
                      <div
                        key={p.payment_id}
                        className="um-request-item"
                        onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="um-request-info">
                          <div className="um-request-id">{p.customer_name}</div>
                          <div className="um-request-sub">Amount paid: ₱ {fmt(p.amount_paid)}</div>
                        </div>
                        <div className="um-request-date">Date Paid: {p.date_paid}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* CREDIT APPROVAL LIST */}
          {activeTab === "credit" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("credit")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("credit-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      fontSize: "16px",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  ↕ Sort By
                </button>
              </div>

              {/* Orders List */}
              <div className="um-list-container">
                {creditData?.pending_orders.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No pending orders.</p>
                )}
                {creditData?.pending_orders.map((order) => (
                  <div
                    key={order.order_id}
                    className="um-request-item"
                    onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="um-request-info">
                      <div className="um-request-id">ORDER ID XX{order.order_id}</div>
                      <div className="um-request-sub">Ordered by: {order.customer_name}</div>
                    </div>
                    <div className="um-request-date">Date Ordered: {order.date_ordered}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CREDIT APPROVAL - VIEW ALL */}
          {activeTab === "credit-all" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("credit")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("credit-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      fontSize: "16px",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  ↕ Sort By
                </button>
              </div>

              {/* Table View */}
              <div style={{ 
                backgroundColor: "white", 
                border: "1px solid #262626", 
                borderRadius: "15px", 
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #262626" }}>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDER ID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>AMOUNT</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>DATE ORDERED</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>ORDERED BY</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditData?.pending_orders.map((order, idx) => (
                      <tr 
                        key={order.order_id}
                        onClick={() => navigate(`/credit-manager/approve/${order.order_id}`)}
                        style={{ 
                          borderBottom: idx < creditData.pending_orders.length - 1 ? "1px solid #e0e0e0" : "none",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <td style={{ padding: "15px", fontSize: "14px", fontWeight: "600" }}>XX{order.order_id}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>₱ 50,000.00</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>{order.date_ordered}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>{order.customer_name}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>
                          <span style={{ 
                            padding: "4px 12px", 
                            borderRadius: "12px", 
                            backgroundColor: "#D1E7DD",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}>
                            Credit Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* PAYMENT REVIEW LIST */}
          {activeTab === "payment" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("payment")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("payment-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      fontSize: "16px",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  ↕ Sort By
                </button>
              </div>

              {/* Payments List */}
              <div className="um-list-container">
                {payments.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No pending payments.</p>
                )}
                {payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="um-request-item"
                    onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="um-request-info">
                      <div className="um-request-id">{p.customer_name}</div>
                      <div className="um-request-sub">Amount paid: ₱ {fmt(p.amount_paid)}</div>
                    </div>
                    <div className="um-request-date">Date Paid: {p.date_paid}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PAYMENT REVIEW - VIEW ALL */}
          {activeTab === "payment-all" && (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", gap: "30px", borderBottom: "2px solid #e0e0e0", marginBottom: "20px" }}>
                <button
                  onClick={() => setActiveTab("payment")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#888",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("payment-all")}
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1f3d1a",
                    borderBottom: "3px solid #1f3d1a",
                    marginBottom: "-2px",
                    paddingBottom: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  View All
                </button>
              </div>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      fontSize: "16px",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  ↕ Sort By
                </button>
              </div>

              {/* Table View */}
              <div style={{ 
                backgroundColor: "white", 
                border: "1px solid #262626", 
                borderRadius: "15px", 
                overflow: "hidden"
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "1px solid #262626" }}>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>CUSTOMER</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>AMOUNT PAID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>DATE PAID</th>
                      <th style={{ padding: "15px", textAlign: "left", fontWeight: "600", fontSize: "14px" }}>CONFIRMED BY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, idx) => (
                      <tr 
                        key={p.payment_id}
                        onClick={() => navigate(`/credit-manager/payment/${p.payment_id}`)}
                        style={{ 
                          borderBottom: idx < payments.length - 1 ? "1px solid #e0e0e0" : "none",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                      >
                        <td style={{ padding: "15px", fontSize: "14px", fontWeight: "600" }}>{p.customer_name}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>₱ {fmt(p.amount_paid)}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>{p.date_paid}</td>
                        <td style={{ padding: "15px", fontSize: "14px" }}>CM1234</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CREDIT ADJUSTMENT - CUSTOMER LIST */}
          {activeTab === "adjustment" && (
            <>
              <p style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>
                Credit Customers:
              </p>

              {/* Search and Sort */}
              <div style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
                <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                  <span style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", fontSize: "18px" }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 45px",
                      fontSize: "16px",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      backgroundColor: "white"
                    }}
                  />
                </div>
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  ↕ Sort By
                </button>
              </div>

              {/* Customer Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {filteredCustomers.length === 0 && (
                  <p style={{ color: "#888", padding: "1rem" }}>No customers found.</p>
                )}
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.customer_id}
                    onClick={() => navigate(`/credit-manager/customer/${customer.customer_id}/details`)}
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #262626",
                      borderRadius: "15px",
                      padding: "20px 30px",
                      cursor: "pointer",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9F9F9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                  >
                    <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "15px" }}>
                      {customer.name}
                    </h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Phone Number:</span> {customer.phone || "N/A"}
                        </div>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Email Address:</span> {customer.email || "N/A"}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "right" }}>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Credit Limit:</span> ₱ {fmt(customer.credit_limit)}
                        </div>
                        <div style={{ fontSize: "16px" }}>
                          <span style={{ fontWeight: "600" }}>Outstanding Balance:</span> ₱ {fmt(customer.outstanding_balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}