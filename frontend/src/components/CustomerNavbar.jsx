import { Link, useNavigate } from "react-router-dom";
import { getCookie } from "../utils/csrf";

export default function CustomerNavbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
      credentials: "include",
    });

    navigate("/login");
  }

  return (
    <nav
      style={{
        height: "60px",
        padding: "0 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <h3>Mylora</h3>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link to="/home">Home</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/account">Account</Link>

        <button
          onClick={handleLogout}
          style={{
            padding: "0.4rem 0.75rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
