import { apiUrl } from "../config/api";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function MyProfile({ embedded = false }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);

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

        if (response.status === 404) {
          setProfileMissing(true);
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        setPatient(data.data);
      } catch (err) {
        console.error("My Profile error:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  if (loading) {
    return <p>Loading your profile...</p>;
  }

  if (error) {
    return (
      <div>
        {!embedded && <h1>My Profile</h1>}
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (profileMissing) {
    return (
      <div>
        {!embedded && <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>Create your patient profile to access personalized health services.</p>
          </div>
        </div>}

        <section>
          <h2>No patient profile yet</h2>
          <p>
            Add your personal, contact, and emergency information so the
            health center can assist you properly.
          </p>
          <button onClick={() => navigate("/profile")}>Create My Profile</button>
          {!embedded && <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>}
        </section>
      </div>
    );
  }

  if (!patient) {
    return <p>No patient profile found.</p>;
  }

  const formatDate = (date) => {
    if (!date) return "Not provided";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      <h2>My Patient Profile</h2>
      <p>View your registered personal information.</p>

      <hr />

      <h2>Account Information</h2>
      <p><strong>Full Name:</strong> {patient.userId?.fullName}</p>
      <p><strong>Email:</strong> {patient.userId?.email}</p>
      <p><strong>Patient Number:</strong> {patient.patientNumber}</p>

      <hr />

      <h2>Personal Information</h2>
      <p><strong>Birth Date:</strong> {formatDate(patient.birthDate)}</p>
      <p><strong>Sex:</strong> {patient.sex}</p>
      <p><strong>Address:</strong> {patient.address}</p>
      <p><strong>Contact Number:</strong> {patient.contactNumber}</p>

      <hr />

      <h2>Emergency Contact</h2>
      <p>
        <strong>Name:</strong>{" "}
        {patient.emergencyContact?.name || "Not provided"}
      </p>
      <p>
        <strong>Relationship:</strong>{" "}
        {patient.emergencyContact?.relationship || "Not provided"}
      </p>
      <p>
        <strong>Contact Number:</strong>{" "}
        {patient.emergencyContact?.contactNumber || "Not provided"}
      </p>

      <hr />

      <div>
  <button onClick={() => navigate("/edit-profile")}>
    Edit My Profile
  </button>

  {!embedded && <button onClick={() => navigate("/dashboard")}>
    Back to Dashboard
  </button>}
</div>
    </div>
  );
}

export default MyProfile;
