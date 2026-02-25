import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCookie } from "../../../utils/csrf";
import "./Login.css";
import logo from "../../../assets/mylora-logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1️⃣ Login
      const res = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login failed");
      }

      // 2️⃣ Get logged-in user + roles
      const meRes = await fetch("http://localhost:8000/api/me/", {
        credentials: "include",
      });

      if (!meRes.ok) {
        throw new Error("Failed to fetch user info");
      }

      const me = await meRes.json();

      if (me.roles.includes("upper_management")) {
        navigate("/internal/dashboard");
      } else if (me.roles.includes("credit_manager")) {
        navigate("/credit-manager/dashboard");
      } else if (me.roles.includes("order_processor")) {
        navigate("/order-processor/dashboard");
      } else {
        navigate("/customer/dashboard");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

 /*return (
   <div className="login-page-container">
     <div className="login-card">
       <div className="header-brand">
         <img src={logo} alt="Mylora Logo" className="mylora-logo" />
         <h1 className="system-title">Web Credit System</h1>
       </div>
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
 ); */

 return (
   <div className="login-page-wrapper"> 
     
     {/* SECTION 1: Branding (Logo + Title) */}
     <header className="brand-section">
       <img src={logo} alt="Mylora Logo" className="logo-img" />
       <h1 className="system-title">Web Credit System</h1>
     </header>

     {/* SECTION 2: The Card Container */}
     <main className="login-card-section">
       <div className="login-card">         
         <form onSubmit={handleSubmit} className="login-form">
           {/* Email Group */}
           <div className="form-group">
             <label className="form-label">Email</label>
             <input
               type="text"
               className="form-input"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               required
             />
           </div>

    {/* Password Group */}
    <div className="form-group">
      <div className="label-wrapper">
        <label className="form-label">Password</label>
        
        {error && (
          <button 
            type="button" 
            className="forgot-password-link"
            /* onClick={() => navigate("/forgot-password")} */
          >
            Forgot Password?
          </button>
        )}
      </div>

      <input
        type="password"
        className="form-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

           {error && <p className="error-message">{error}</p>}

           {/* Actions Group */}
           <div className="form-actions">
             <button type="submit" className="btn-submit" disabled={loading}>
               {loading ? "Logging in..." : "Login"}
             </button>

             <Link to="/apply/step-1" className="enroll-link">
               Enroll for a credit account
             </Link>
           </div>
         </form>
       </div>
     </main>
   </div>
 );
}
