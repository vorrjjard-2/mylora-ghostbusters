import { useState } from "react";
import ApplicationSubmittedModal from "../../components/ApplicationSubmittedModal";

export default function ApplyStep2() {
  // Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Address
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [branch, setBranch] = useState("");

  // Credit
  const [creditAmount, setCreditAmount] = useState("");
  const [creditTerm, setCreditTerm] = useState("");

  // UI state
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [applicationId, setApplicationId] = useState(null);

  // 🔑 THIS IS THE FUNCTION YOU ASKED ABOUT
  async function handleNext(e) {
    e.preventDefault();
    setError(null);

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !address1 ||
      !barangay ||
      !city ||
      !zipCode ||
      !branch ||
      !creditAmount ||
      !creditTerm
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const step1 = JSON.parse(
      localStorage.getItem("application_step_1")
    );

    if (!step1) {
      setError("Application session expired. Please start again.");
      return;
    }

    const payload = {
      step1,
      step2: {
        firstName,
        lastName,
        phone,
        email,
        address1,
        address2,
        barangay,
        city,
        zipCode,
        branch,
        creditAmount,
        creditTerm,
      },
    };

    try {
      setSubmitting(true);

      const res = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to submit application");
      }

      const data = await res.json();

      // ✅ SHOW MODAL WITH APPLICATION NUMBER
      setApplicationId(data.application_id);
      setShowModal(true);

      // Clear saved data
      localStorage.removeItem("application_step_1");

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ maxWidth: 900, margin: "3rem auto" }}>
        <h1>Enrol for a credit line.</h1>

        <form onSubmit={handleNext}>
          <h3>01 Personal Information</h3>
          <input placeholder="First Name*" onChange={e => setFirstName(e.target.value)} />
          <input placeholder="Last Name*" onChange={e => setLastName(e.target.value)} />
          <input placeholder="Phone Number*" onChange={e => setPhone(e.target.value)} />
          <input placeholder="Email Address*" onChange={e => setEmail(e.target.value)} />

          <h3>02 Delivery Address</h3>
          <input placeholder="Address 1*" onChange={e => setAddress1(e.target.value)} />
          <input placeholder="Address 2" onChange={e => setAddress2(e.target.value)} />
          <input placeholder="Barangay*" onChange={e => setBarangay(e.target.value)} />
          <input placeholder="City*" onChange={e => setCity(e.target.value)} />
          <input placeholder="Zip Code*" onChange={e => setZipCode(e.target.value)} />

          <select onChange={e => setBranch(e.target.value)}>
            <option value="">Select preferred branch*</option>
            <option value="branch-a">Branch A</option>
            <option value="branch-b">Branch B</option>
          </select>

          <h3>03 Credit Line Application</h3>
          <input
            type="number"
            placeholder="Credit amount*"
            onChange={e => setCreditAmount(e.target.value)}
          />

          <select onChange={e => setCreditTerm(e.target.value)}>
            <option value="">Preferred credit term*</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>

      {/* ✅ MODAL POPUP */}
      {showModal && (
        <ApplicationSubmittedModal
          applicationId={applicationId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
