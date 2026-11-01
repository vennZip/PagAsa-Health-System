import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";

function StaffPatients() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();

      const response = await fetch(
        "http://localhost:5000/api/patients",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load patients."
        );
      }

      setPatients(data.data || []);

    } catch (err) {
      setError(err.message || "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPatients();
    }
  }, [currentUser]);

  // Search patients by name or patient number
  const filteredPatients = patients.filter((patient) => {
    const name = patient.userId?.fullName || "";
    const patientNumber = patient.patientNumber || "";

    const searchValue = search.toLowerCase();

    return (
      name.toLowerCase().includes(searchValue) ||
      patientNumber.toLowerCase().includes(searchValue)
    );
  });

  return (
    <div>
      <h1>Patient Management</h1>

      <p>View and manage registered patients.</p>

      <button onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </button>

      <button onClick={fetchPatients} disabled={loading}>
        {loading ? "Loading..." : "Refresh Patients"}
      </button>

      <hr />

      {loading && <p>Loading patients...</p>}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <h3>Total Patients: {patients.length}</h3>

          <div>
            <input
              type="text"
              placeholder="Search by name or patient number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <br />

          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Patient Number</th>
                <th>Full Name</th>
                <th>Sex</th>
                <th>Contact Number</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>{patient.patientNumber}</td>

                    <td>
                      {patient.userId?.fullName || "N/A"}
                    </td>

                    <td>{patient.sex || "N/A"}</td>

                    <td>{patient.contactNumber || "N/A"}</td>

                    <td>
                      <button
  onClick={() => navigate(`/staff-patients/${patient._id}`)}
>
  View Profile
</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default StaffPatients;