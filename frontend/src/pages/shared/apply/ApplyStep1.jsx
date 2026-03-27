import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../assets/mylora-logo.png";
import "./ApplyStep1.css"

export default function ApplyStep1() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function handleNext(e) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Email is required.");
      return;
    }

    localStorage.setItem(
      "application_step_1",
      JSON.stringify({ email })
    );

    navigate("/apply/step-2");
  }

return (
<div className="apply1-page-wrapper">
  {/* Top Header Branding */}
  <header className="apply-header">
    <div className="header-brand">
        <img src={logo} alt="Mylora Logo" className="mylora-logo" />
      <span className="header-title">Web Credit System</span>
    </div>
  </header>
  <div className="apply-container">
    <h1 className="main-title">Apply for Credit Account.</h1>
    <p className="sub-title">Enter email to begin application.</p>
    <form onSubmit={handleNext} className="apply-form">
      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="form-footer">
        <button type="button" className="btn-back" onClick={() => navigate("/login")}>Back</button>
        <button type="submit" className="btn-continue">
          Continue
        </button>
      </div>
    </form>
  </div>
</div>
);
}
