import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{ maxWidth: 720, margin: "4rem auto" }}>
      <h1>New user? Apply for a credit account.</h1>
      <p>Enter your email to start the application.</p>

      <form onSubmit={handleNext}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.75rem" }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">
          Continue Application
        </button>
      </form>
    </div>
  );
}
