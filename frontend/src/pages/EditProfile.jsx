import { apiUrl } from "../config/api";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import {
  PHILIPPINE_MOBILE_PATTERN,
  sanitizePhilippineMobile
} from "../utils/phone";

function EditProfile() {
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing patient information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await currentUser.getIdToken();

        const response = await fetch(
          apiUrl("/api/patients/me"),
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        const patient = data.data;

        setFormData({
          birthDate: patient.birthDate
            ? new Date(patient.birthDate).toISOString().split("T")[0]
            : "",
          sex: patient.sex || "",
          address: patient.address || "",
          contactNumber: patient.contactNumber || "",
          emergencyName: patient.emergencyContact?.name || "",
          emergencyRelationship:
            patient.emergencyContact?.relationship || "",
          emergencyContactNumber:
            patient.emergencyContact?.contactNumber || ""
        });

      } catch (err) {
        console.error("Load profile error:", err);
        setError(err.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const value = ["contactNumber", "emergencyContactNumber"].includes(e.target.name)
      ? sanitizePhilippineMobile(e.target.value)
      : e.target.value;

    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Save updated patient information
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/patients/me"),
        {
          method: "PUT",
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
        throw new Error(data.message || "Failed to update profile.");
      }

      setSuccess("Your profile has been updated successfully.");

    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading your profile...</p>;
  }

  return (
    <div>
      <h1>Edit My Profile</h1>
      <p>Update your personal and contact information.</p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit}>
        <h2>Personal Information</h2>

        <label>Birth Date</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          required
        />

        <br /><br />

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

        <br /><br />

        <label>Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />

        <br /><br />

        <label>Contact Number</label>
        <input
          type="tel"
          inputMode="numeric"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          pattern={PHILIPPINE_MOBILE_PATTERN}
          maxLength="11"
          placeholder="09XXXXXXXXX"
          title="Enter an 11-digit Philippine mobile number beginning with 09."
          required
        />

        <h2>Emergency Contact</h2>

        <label>Contact Name</label>
        <input
          type="text"
          name="emergencyName"
          value={formData.emergencyName}
          onChange={handleChange}
        />

        <br /><br />

        <label>Relationship</label>
        <input
          type="text"
          name="emergencyRelationship"
          value={formData.emergencyRelationship}
          onChange={handleChange}
        />

        <br /><br />

        <label>Emergency Contact Number</label>
        <input
          type="tel"
          inputMode="numeric"
          name="emergencyContactNumber"
          value={formData.emergencyContactNumber}
          onChange={handleChange}
          pattern={PHILIPPINE_MOBILE_PATTERN}
          maxLength="11"
          placeholder="09XXXXXXXXX"
          title="Enter an 11-digit Philippine mobile number beginning with 09."
        />

        <br /><br />

        <button type="submit" disabled={saving}>
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>

      <br />

      <button onClick={() => navigate("/my-profile")}>
        Cancel
      </button>
    </div>
  );
}

export default EditProfile;
