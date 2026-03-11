import { API_BASE_URL } from "../../../utils/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApplicationSubmittedModal from "../../../components/ApplicationSubmittedModal";
import logo from "../../../assets/mylora-logo.png";
import fileIcon from "../../../assets/file.png";
import "./ApplyStep2.css";

export default function ApplyStep2() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [province, setProvince] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [branch, setBranch] = useState("");

  // Billing address
  const [sameAsDelivery, setSameAsDelivery] = useState(false);
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingProvinceName, setBillingProvinceName] = useState("");
  const [billingCityCode, setBillingCityCode] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingBarangay, setBillingBarangay] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [billingCities, setBillingCities] = useState([]);
  const [billingBarangaysList, setBillingBarangaysList] = useState([]);

  const [provinces, setProvinces] = useState([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/branches/`)
      .then(r => r.json())
      .then(data => setBranches(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then(r => r.json())
      .then(data => setProvinces(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!province) {
      setCitiesMunicipalities([]);
      setCityCode("");
      setCity("");
      setProvinceName("");
      setBarangays([]);
      setBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/provinces/${province}/cities-municipalities/`)
      .then(r => r.json())
      .then(data => setCitiesMunicipalities(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, [province]);

  useEffect(() => {
    if (!cityCode) {
      setBarangays([]);
      setBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cityCode}/barangays/`)
      .then(r => r.json())
      .then(data => setBarangays(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, [cityCode]);

  // Billing PSGC cascade
  useEffect(() => {
    if (!billingProvince) {
      setBillingCities([]);
      setBillingCityCode("");
      setBillingCity("");
      setBillingProvinceName("");
      setBillingBarangaysList([]);
      setBillingBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/provinces/${billingProvince}/cities-municipalities/`)
      .then(r => r.json())
      .then(data => setBillingCities(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, [billingProvince]);

  useEffect(() => {
    if (!billingCityCode) {
      setBillingBarangaysList([]);
      setBillingBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${billingCityCode}/barangays/`)
      .then(r => r.json())
      .then(data => setBillingBarangaysList(data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, [billingCityCode]);

  const handleSameAsDelivery = (checked) => {
    setSameAsDelivery(checked);
    if (checked) {
      setBillingAddress1(address1);
      setBillingAddress2(address2);
      setBillingProvinceName(provinceName);
      setBillingCity(city);
      setBillingBarangay(barangay);
      setBillingZipCode(zipCode);
      setBillingProvince("");
      setBillingCityCode("");
      setBillingCities([]);
      setBillingBarangaysList([]);
    } else {
      setBillingAddress1("");
      setBillingAddress2("");
      setBillingProvinceName("");
      setBillingCity("");
      setBillingBarangay("");
      setBillingZipCode("");
    }
  };

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
      !branch || !creditAmount || !creditTerm ||
      supportingDocs.length < 2. // ADDED TO CHECK FOR AT LEAST 2 DOCS
    ) {
    if (supportingDocs.length < 2) {
            setError("Please upload at least 2 supporting documents.");  // ADDED ERROR MESSAGE FOR LACKING DOCS
        } else {
            setError("Please complete all required fields.");
        }
        return;
    }

    if (!govId) {
        setError("Please upload a Government-Issued ID.");  // ADDED ERROR MESSAGE FOR NO GOV ID
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
          province: provinceName,
          barangay,
          city,
          zipCode,
          branch,
          creditAmount,
          creditTerm,
          billingAddress1: sameAsDelivery ? address1 : billingAddress1,
          billingAddress2: sameAsDelivery ? address2 : billingAddress2,
          billingProvince: sameAsDelivery ? provinceName : billingProvinceName,
          billingBarangay: sameAsDelivery ? barangay : billingBarangay,
          billingCity: sameAsDelivery ? city : billingCity,
          billingZipCode: sameAsDelivery ? zipCode : billingZipCode,
        })
      );

      if (supportingDocs[0]) formData.append("doc1", supportingDocs[0]);
      if (supportingDocs[1]) formData.append("doc2", supportingDocs[1]);
      if (govId) formData.append("gov_id", govId);

      const res = await fetch(`${API_BASE_URL}/api/applications/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Submission failed");
      }

      setApplicationId(data.application_id);
      setShowModal(true);
      localStorage.removeItem("application_step_1");

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // For currency formatting
  const formatAsCurrency = (value) => {
      if (!value) return "";
      // Remove all non-digits
      const number = value.toString().replace(/\D/g, "");
      if (!number) return "";
      // Format with commas and add the Peso sign
      return "₱" + Number(number).toLocaleString("en-PH");
    };

 return (
   <>
     <div className="apply2-page-wrapper">
     <header className="apply-header">
       <div className="header-brand">
         <img src={logo} alt="Mylora Logo" className="mylora-logo" />
         <span className="header-title">Web Credit System</span>
       </div>
     </header>
     <div className="apply-container">
       <h1 className="main-title">Enroll for a credit line.</h1>
       <form onSubmit={handleSubmit} className="enroll-form">

         {/* Section 01 */}
         <section className="form-section">
           <h2 className="section-title">01 Personal Information</h2>
           <div className="input-grid">
             <div className="input-group">
               <label>First Name<span className="required">*</span></label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    if (value === '' || /^[A-Z\s]+$/.test(value)) {
                      setFirstName(value);
                    }
                  }}
                  style={{ textTransform: "uppercase" }}
                  required
                />
           </div>
           <div className="input-group">
               <label>Last Name<span className="required">*</span></label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    if (value === '' || /^[A-Z\s]+$/.test(value)) {
                      setLastName(value);
                    }
                  }}
                  style={{ textTransform: "uppercase" }}
                  required
                />
           </div>
           <div className="input-group full-width">
               <label>Phone Number<span className="required">*</span></label>
                <input
                      type="text"
                      placeholder="+63 9XX XXX XXXX"
                      value={phone}
                      onChange={e => {
                        // Strip everything except digits
                        let raw = e.target.value.replace(/\D/g, "");

                        // If user typed leading 63, strip it (we add the prefix)
                        if (raw.startsWith("63")) raw = raw.substring(2);
                        // If user typed leading 0 (e.g. 09...), strip the 0
                        if (raw.startsWith("0")) raw = raw.substring(1);

                        // Limit to 10 digits (the part after +63)
                        if (raw.length > 10) raw = raw.substring(0, 10);

                        // Format as +63 9XX XXX XXXX
                        let formatted = "+63";
                        if (raw.length > 0) {
                          formatted += " " + raw.substring(0, 3);
                        }
                        if (raw.length > 3) {
                          formatted += " " + raw.substring(3, 6);
                        }
                        if (raw.length > 6) {
                          formatted += " " + raw.substring(6, 10);
                        }

                        setPhone(raw.length === 0 ? "" : formatted);
                      }}
                      required
                    />
                </div>
           </div>
         </section>
    
         {/* Section 2 */}
         <section className="form-section">
           <h2 className="section-title">02 Delivery Address</h2>
           <div className="input-group full-width">
             <label>Address 1<span className="required">*</span></label>
              <input 
                  type="text" 
                  placeholder="UNIT NO., BLDG NAME, STREET" 
                  value={address1} 
                  onChange={e => setAddress1(e.target.value.toUpperCase())} 
                  required 
                />           
              </div>
           <div className="input-group full-width">
             <label>Address 2</label>
                <input 
                    type="text" 
                    placeholder="LANDMARK STATUE" 
                    value={address2}
                    onChange={e => setAddress2(e.target.value.toUpperCase())} 
                  />           
              </div>
           <div className="input-grid three-col">
             <div className="input-group">
               <label>Province<span className="required">*</span></label>
               <select
                 value={province}
                 onChange={e => {
                   const selected = provinces.find(p => p.code === e.target.value);
                   setProvince(e.target.value);
                   setProvinceName(selected ? selected.name : "");
                 }}
                 required
               >
                 <option value="">Select province</option>
                 {provinces.map(p => (
                   <option key={p.code} value={p.code}>{p.name}</option>
                 ))}
               </select>
             </div>
             <div className="input-group">
               <label>City / Municipality<span className="required">*</span></label>
               <select
                 value={cityCode}
                 onChange={e => {
                   const selected = citiesMunicipalities.find(c => c.code === e.target.value);
                   setCityCode(e.target.value);
                   setCity(selected ? selected.name : "");
                 }}
                 disabled={!province}
                 required
               >
                 <option value="">Select city / municipality</option>
                 {citiesMunicipalities.map(c => (
                   <option key={c.code} value={c.code}>{c.name}</option>
                 ))}
               </select>
             </div>
             <div className="input-group">
               <label>Barangay<span className="required">*</span></label>
               <select
                 value={barangay}
                 onChange={e => setBarangay(e.target.value)}
                 disabled={!cityCode}
                 required
               >
                 <option value="">Select barangay</option>
                 {barangays.map(b => (
                   <option key={b.code} value={b.name}>{b.name}</option>
                 ))}
               </select>
             </div>
           </div>
           <div className="input-group">
             <label>Zip Code<span className="required">*</span></label>
             <input
               type="text"
               placeholder="XXXX"
               value={zipCode}
               onChange={e => {
                 const value = e.target.value.replace(/\D/g, "");
                 if (value.length <= 4) setZipCode(value);
               }}
               required
             />
           </div>
           <div className="input-group">
             <label>Default Store Branch<span className="required">*</span></label>
             <select value={branch} onChange={e => setBranch(e.target.value)} required>
               <option value="">Select your preferred branch</option>
               {branches.map(b => (
                 <option key={b.branch_id} value={b.branch_id}>{b.name}</option>
               ))}
             </select>
           </div>
         </section>

         {/* Section 03 - Billing Address */}
         <section className="form-section">
           <h2 className="section-title">03 Billing Address</h2>
           <label className="delivery-autofill-label" style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
             <input
               type="checkbox"
               checked={sameAsDelivery}
               onChange={e => handleSameAsDelivery(e.target.checked)}
             />
             Same as delivery address
           </label>

           <div className="input-group full-width">
             <label>Address 1<span className="required">*</span></label>
             <input
               type="text"
               placeholder="UNIT NO., BLDG NAME, STREET"
               value={sameAsDelivery ? address1 : billingAddress1}
               onChange={e => setBillingAddress1(e.target.value.toUpperCase())}
               readOnly={sameAsDelivery}
               style={sameAsDelivery ? { backgroundColor: "#f0f0f0" } : {}}
               required
             />
           </div>
           <div className="input-group full-width">
             <label>Address 2</label>
             <input
               type="text"
               placeholder="LANDMARK STATUE"
               value={sameAsDelivery ? address2 : billingAddress2}
               onChange={e => setBillingAddress2(e.target.value.toUpperCase())}
               readOnly={sameAsDelivery}
               style={sameAsDelivery ? { backgroundColor: "#f0f0f0" } : {}}
             />
           </div>
           <div className="input-grid three-col">
             <div className="input-group">
               <label>Barangay<span className="required">*</span></label>
               {sameAsDelivery ? (
                 <input type="text" value={barangay} readOnly style={{ backgroundColor: "#f0f0f0" }} />
               ) : (
                 <select
                   value={billingBarangay}
                   onChange={e => setBillingBarangay(e.target.value)}
                   disabled={!billingCityCode}
                   required
                 >
                   <option value="">Select barangay</option>
                   {billingBarangaysList.map(b => (
                     <option key={b.code} value={b.name}>{b.name}</option>
                   ))}
                 </select>
               )}
             </div>
             <div className="input-group">
               <label>City<span className="required">*</span></label>
               {sameAsDelivery ? (
                 <input type="text" value={city} readOnly style={{ backgroundColor: "#f0f0f0" }} />
               ) : (
                 <select
                   value={billingCityCode}
                   onChange={e => {
                     const selected = billingCities.find(c => c.code === e.target.value);
                     setBillingCityCode(e.target.value);
                     setBillingCity(selected ? selected.name : "");
                   }}
                   disabled={!billingProvince}
                   required
                 >
                   <option value="">Select city / municipality</option>
                   {billingCities.map(c => (
                     <option key={c.code} value={c.code}>{c.name}</option>
                   ))}
                 </select>
               )}
             </div>
             <div className="input-group">
               <label>Zip Code<span className="required">*</span></label>
               <input
                 type="text"
                 placeholder="XXXX"
                 value={sameAsDelivery ? zipCode : billingZipCode}
                 onChange={e => {
                   const value = e.target.value.replace(/\D/g, "");
                   if (value.length <= 4) setBillingZipCode(value);
                 }}
                 readOnly={sameAsDelivery}
                 style={sameAsDelivery ? { backgroundColor: "#f0f0f0" } : {}}
                 required
               />
             </div>
           </div>
           {!sameAsDelivery && (
             <div className="input-group">
               <label>Province<span className="required">*</span></label>
               <select
                 value={billingProvince}
                 onChange={e => {
                   const selected = provinces.find(p => p.code === e.target.value);
                   setBillingProvince(e.target.value);
                   setBillingProvinceName(selected ? selected.name : "");
                 }}
                 required
               >
                 <option value="">Select province</option>
                 {provinces.map(p => (
                   <option key={p.code} value={p.code}>{p.name}</option>
                 ))}
               </select>
             </div>
           )}
         </section>

         {/* Section 04 */}
         <section className="form-section">
           <h2 className="section-title">04 Credit Line Application</h2>
            <div className="input-group full-width">
                <label>How much credit are you applying for?</label>
                <input 
                  type="text" 
                  placeholder="₱0" 
                  // Display the formatted version 
                  value={formatAsCurrency(creditAmount)}
                  onChange={(e) => {
                    // Strip everything except numbers before saving to state 
                    const rawValue = e.target.value.replace(/\D/g, "");
                    setCreditAmount(rawValue);
                  }} 
                />
              </div>
           <div className="input-group">
             <label>What is your preferred credit term?</label>
             <select onChange={e => setCreditTerm(e.target.value)}>
               <option value="">Select your preferred terms</option>
               <option value="30">30 Days</option>
               <option value="60">60 Days</option>
               <option value="90">90 Days</option>
             </select>
           </div>
         </section>

        {/* Section 05 */}
        <section className="form-section">
          <h2 className="section-title">05 Upload Supporting Documents</h2>
          <div className="section-header-text">
            <p>The following supporting documents are required:</p>
            <ul className="required-docs-list">
              <li>Document 1<span className="required">*</span></li>
              <li>Document 2<span className="required">*</span></li>
              <li>Document 3 <span>(optional)</span></li>
            </ul>
          </div>
          {supportingDocs.length > 0 ? (
            <div className="file-list-container">
              {supportingDocs.map((file, index) => (
                <div key={index} className="file-display-badge">
                <img src={fileIcon} alt="File Icon" className="custom-file-icon" />                  
                <span className="file-name">{file.name}</span>
                  <button type="button" className="remove-file" onClick={() => setSupportingDocs(supportingDocs.filter((_, i) => i !== index))}>×</button>
                </div>
              ))}
              <button type="button" className="add-more-files" onClick={() => document.getElementById('docs-input').click()}>+ Add more</button>
              <input
                id="docs-input"
                type="file"
                multiple
                accept=".jpg, .jpeg, .png, .pdf"
                onChange={e => setSupportingDocs([...supportingDocs, ...e.target.files])}
                className="hidden-file-input"
              />
            </div>
          ) : (
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload files here.</p>
                <small className="upload-hint">Supported formats are .jpg, .jpeg, and .png, .pdf. Max file size is 10mb</small>
              </div>
              <input
                type="file"
                multiple
                onChange={e => setSupportingDocs([...e.target.files])}
                className="hidden-file-input"
              />
            </label>
          )}
        </section>

        {/* Section 06 */}
        <section className="form-section">
          <h2 className="section-title">06 Upload a Government-Issued ID</h2>
          <p className="id-hint-text">Please make sure that uploaded image is clear.<span className="required">*</span></p>
          {govId ? (
            <div className="file-list-container">
              <div className="file-display-badge">
                <img src={fileIcon} alt="File Icon" className="custom-file-icon" />                  
                <span className="file-name">{govId.name}</span>
                <button type="button" className="remove-file" onClick={() => setGovId(null)}>×</button>
              </div>
            </div>
          ) : (
            <label className="upload-zone">
              <div className="upload-content">
                <p className="upload-icon">↑ Upload file here.</p>
                <small className="upload-hint">Supported formats are .jpg, .jpeg, and .png. Max file size is 10mb</small>
              </div>
              <input
                type="file"
                accept=".jpg, .jpeg, .png"
                onChange={e => setGovId(e.target.files[0])}
                className="hidden-file-input"
              />
            </label>
          )}
        </section>

        {error && <p className="error-text" style={{color: '#911818', marginLeft: '-40px', marginTop: '20px'}}>{error}</p>}

        <div className="form-footer">
          <button type="button" className="btn-back" onClick={() => navigate("/apply/step-1")}>Back</button>
          <button type="submit" className="btn-next" disabled={submitting}>
            {submitting ? "Submitting..." : "Next"}
          </button>
        </div>

        <div className="form-footer">
</div>

      </form> {/* Closing the enroll-form */}
    </div> {/* Closing the apply-container */}
  </div> {/* Closing the apply2-page-wrapper */}

  {showModal && (
    <ApplicationSubmittedModal
      applicationId={applicationId}
      onClose={() => navigate("/login")}
    />
  )}
</>
 );
}

