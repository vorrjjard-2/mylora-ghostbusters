import { useState } from "react";
import ApplicationSubmittedModal from "../../components/ApplicationSubmittedModal";

export default function ApplyStep2() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [branch, setBranch] = useState("");

  const [creditAmount, setCreditAmount] = useState("");
  const [creditTerm, setCreditTerm] = useState("");

  const [supportingDocs, setSupportingDocs] = useState([]);
  const [govId, setGovId] = useState(null);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [applicationId, setApplicationId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (
      !firstName || !lastName || !phone ||
      !address1 || !barangay || !city || !zipCode ||
      !branch || !creditAmount || !creditTerm
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const step1 = JSON.parse(localStorage.getItem("application_step_1"));
    if (!step1) {
      setError("Session expired. Please start again.");
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append("step1", JSON.stringify(step1));
      formData.append(
        "step2",
        JSON.stringify({
          firstName,
          lastName,
          phone,
          address1,
          address2,
          barangay,
          city,
          zipCode,
          branch,
          creditAmount,
          creditTerm,
        })
      );

      if (supportingDocs[0]) formData.append("doc1", supportingDocs[0]);
      if (supportingDocs[1]) formData.append("doc2", supportingDocs[1]);
      if (govId) formData.append("gov_id", govId);

      const res = await fetch("http://localhost:8000/api/applications/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Submission failed");

      const data = await res.json();
      setApplicationId(data.application_id);
      setShowModal(true);
      localStorage.removeItem("application_step_1");

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div style={{ maxWidth: 1000, margin: "3rem auto" }}>
        <h1>Enrol for a credit line.</h1>

        <form onSubmit={handleSubmit}>
          <h3>01 Personal Information</h3>
          <div className="grid-2">
            <input placeholder="First Name*" onChange={e => setFirstName(e.target.value)} />
            <input placeholder="Last Name*" onChange={e => setLastName(e.target.value)} />
            <input placeholder="Phone Number*" onChange={e => setPhone(e.target.value)} />
          </div>

          <h3>02 Delivery Address</h3>
          <input placeholder="Address 1*" onChange={e => setAddress1(e.target.value)} />
          <input placeholder="Address 2" onChange={e => setAddress2(e.target.value)} />

          <div className="grid-3">
            <input placeholder="Barangay*" onChange={e => setBarangay(e.target.value)} />
            <input placeholder="City*" onChange={e => setCity(e.target.value)} />
            <input placeholder="Zip Code*" onChange={e => setZipCode(e.target.value)} />
          </div>

          <select onChange={e => setBranch(e.target.value)}>
            <option value="">Select your preferred branch*</option>
            <option value="branch-a">Branch A</option>
            <option value="branch-b">Branch B</option>
          </select>

          <h3>03 Credit Line Application</h3>
          <input
            type="number"
            placeholder="Enter your amount here"
            onChange={e => setCreditAmount(e.target.value)}
          />

          <select onChange={e => setCreditTerm(e.target.value)}>
            <option value="">Select your preferred terms</option>
            <option value="30">30 Days</option>
            <option value="60">60 Days</option>
            <option value="90">90 Days</option>
          </select>

          <h3>04 Upload Supporting Documents</h3>
          <div style={{ marginBottom: "1rem" }}>
                <label>Supporting Document 1 *</label>
                <input
                type="file"
                required
                onChange={e => setSupportingDocs(prev => [e.target.files[0], prev[1]])}
                />
                </div>


<div>
<label>Supporting Document 2 *</label>
<input
type="file"
required
onChange={e => setSupportingDocs(prev => [prev[0], e.target.files[0]])}
/>
</div>

          <h3>05 Upload a Government-Issued ID</h3>
          <input
            type="file"
            onChange={e => setGovId(e.target.files[0])}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
            <button type="button">Back</button>
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Next"}
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <ApplicationSubmittedModal
          applicationId={applicationId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}