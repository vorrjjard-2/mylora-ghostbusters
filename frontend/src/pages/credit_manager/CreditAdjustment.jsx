import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CreditAdjustment() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/cm/customers/", {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load customers");
        return res.json();
      })
      .then(setCustomers)
      .catch((err) => {
        console.error(err);
        alert("Failed to load customers");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.wrapper}>
      {/* Header */}
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
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/credit-manager/dashboard")}
          >
            Dashboard
          </div>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/credit-manager/dashboard")}
          >
            Credit Approval
          </div>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/credit-manager/dashboard")}
          >
            Payment Review
          </div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>
            Credit Adjustment
          </div>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <h1 style={styles.title}>Credit Adjustment</h1>

          <h2 style={styles.subtitle}>Credit Customers:</h2>

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

          {/* Customer Cards */}
          {loading ? (
            <div style={styles.empty}>Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={styles.empty}>No customers found</div>
          ) : (
            <div style={styles.customerGrid}>
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.customer_id}
                  style={styles.customerCard}
                  onClick={() => navigate(`/credit-manager/customer/${customer.customer_id}/details`)}
                >
                  <h3 style={styles.customerName}>{customer.name}</h3>
                  <div style={styles.customerInfo}>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Phone Number:</span>
                      <span>{customer.phone || "N/A"}</span>
                    </div>
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Email Address:</span>
                      <span>{customer.email || "N/A"}</span>
                    </div>
                  </div>
                  <div style={styles.balanceRow}>
                    <div style={styles.balanceItem}>
                      <span style={styles.balanceLabel}>Credit Limit:</span>
                      <span style={styles.balanceValue}>
                        ₱{" "}
                        {parseFloat(customer.credit_limit).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div style={styles.balanceItem}>
                      <span style={styles.balanceLabel}>Outstanding Balance:</span>
                      <span style={styles.balanceValueRed}>
                        ₱{" "}
                        {parseFloat(customer.outstanding_balance).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    borderBottom: "1px solid #e0e0e0",
    background: "#fff",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoIcon: {
    fontSize: "1.5rem",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: 500,
  },
  logoutBtn: {
    padding: "0.5rem 1.25rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  body: {
    display: "flex",
  },
  sidebar: {
    width: "200px",
    background: "#f5f5f5",
    minHeight: "calc(100vh - 70px)",
    borderRight: "1px solid #e0e0e0",
  },
  sideItem: {
    padding: "1rem 1.5rem",
    cursor: "pointer",
    borderBottom: "1px solid #e0e0e0",
    transition: "background 0.2s ease",
  },
  sideItemActive: {
    background: "#1f3d1a",
    color: "#fff",
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: "2rem",
    background: "#fafafa",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: "1.5rem",
  },
  controls: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
  },
  searchBox: {
    flex: 1,
    position: "relative",
    maxWidth: "400px",
  },
  searchIcon: {
    position: "absolute",
    left: "0.75rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "1rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
  },
  sortBtn: {
    padding: "0.75rem 1.5rem",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  customerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))",
    gap: "1.5rem",
  },
  customerCard: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "box-shadow 0.2s ease",
  },
  customerName: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  customerInfo: {
    marginBottom: "1rem",
  },
  infoRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
  },
  infoLabel: {
    fontWeight: 600,
  },
  balanceRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
    paddingTop: "1rem",
    borderTop: "1px solid #e0e0e0",
  },
  balanceItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  balanceLabel: {
    fontSize: "0.85rem",
    color: "#666",
    fontWeight: 600,
  },
  balanceValue: {
    fontSize: "1.1rem",
    fontWeight: 700,
  },
  balanceValueRed: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#b03a2e",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    padding: "3rem",
  },
};