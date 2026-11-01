import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function PatientProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    birthDate: "",
    sex: "",
    address: "",
    contactNumber: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyContactNumber: ""
  });
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  try {
    setLoading(true);

    // Get the Firebase authentication token
    const token = await currentUser.getIdToken();

    // Send patient information to the backend
    const response = await fetch(
      "http://localhost:5000/api/patients",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          birthDate: formData.birthDate,
          sex: formData.sex,
          address: formData.address,
          contactNumber: formData.contactNumber,

          emergencyContact: {
            name: formData.emergencyName,
            relationship: formData.emergencyRelationship,
            contactNumber: formData.emergencyContactNumber
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save patient profile.");
    }

    setSuccess(
      `Profile saved successfully! Your Patient Number is ${data.data.patientNumber}.`
    );

  } catch (err) {
    console.error("Patient profile error:", err);
    setError(err.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <h1>Patient Profile</h1>
      <p>Please complete your personal and contact information.</p>

      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}
        <div>
          <label>Birth Date</label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Sex</label>
          <select
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="">Select sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label>Complete Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Contact Number</label>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </div>

        <h3>Emergency Contact</h3>

        <div>
          <label>Contact Person's Name</label>
          <input
            type="text"
            name="emergencyName"
            value={formData.emergencyName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Relationship</label>
          <input
            type="text"
            name="emergencyRelationship"
            value={formData.emergencyRelationship}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Emergency Contact Number</label>
          <input
            type="tel"
            name="emergencyContactNumber"
            value={formData.emergencyContactNumber}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Profile"}
          </button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/dashboard")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default PatientProfile;