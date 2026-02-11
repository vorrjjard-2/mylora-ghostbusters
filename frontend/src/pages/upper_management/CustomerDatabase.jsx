import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CustomerDatabase() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/um/customers/", {
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
            onClick={() => navigate("/upper-management/dashboard")}
          >
            Dashboard
          </div>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/upper-management/dashboard")}
          >
            Credit Approval
          </div>
          <div
            style={styles.sideItem}
            onClick={() => navigate("/upper-management/dashboard")}
          >
            Credit Override
          </div>
          <div style={{ ...styles.sideItem, ...styles.sideItemActive }}>
            Customer Database
          </div>
          <div style={styles.sideItem}>Add Customer</div>
          <div style={styles.sideItem}>Staff List</div>
        </aside>

        {/* main */}
        <main style={styles.main}>
          <h1 style={styles.greeting}>Customer Database</h1>

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

          {/* Customer List */}
          <div style={styles.customerList}>
            {filteredCustomers.length === 0 && (
              <div style={styles.empty}>No customers found</div>
            )}
            {filteredCustomers.map((customer) => (
              <div
                key={customer.customer_id}
                style={styles.customerCard}
                onClick={() =>
                  navigate(`/upper-management/customer/${customer.customer_id}`)
                }
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

  /* customer list */
  customerList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  customerCard: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "1.25rem",
    cursor: "pointer",
    background: "#fff",
    transition: "box-shadow 0.2s ease",
  },
  customerName: {
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "1rem",
  },
  customerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    marginBottom: "1rem",
  },
  infoRow: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.85rem",
  },
  infoLabel: {
    fontWeight: 600,
    color: "#333",
  },
  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "1rem",
    borderTop: "1px solid #e0e0e0",
  },
  balanceItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  balanceLabel: {
    fontSize: "0.8rem",
    color: "#666",
    fontWeight: 600,
  },
  balanceValue: {
    fontSize: "1rem",
    fontWeight: 700,
  },
  balanceValueRed: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#b03a2e",
  },

  empty: { color: "#888", padding: "1rem 0" },
};