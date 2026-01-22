import { useState } from "react";
import { getCookie } from "../../utils/csrf"; // Path is fixed!
import { Link } from "react-router-dom";
import "./Login.css"; 
import logo from "../../assets/mylora-logo.png"; // Path is fixed!

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // ... your existing fetch logic stays the same ...
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="logo-section">
          <img src={logo} alt="Mylora Logo" className="mylora-logo" />
        </div>
        
        <h1 className="system-title">Web Credit System</h1>

        <form onSubmit={handleSubmit} className="mylora-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <Link to="/apply/step-1" className="enrol-link-btn">
            Enrol for a credit account
          </Link>
        </form>
      </div>
    </div>
  );
}