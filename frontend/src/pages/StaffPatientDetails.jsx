import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Pagination } from "../components/UI";

function StaffPatientDetails() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recordError, setRecordError] = useState("");
  const [recordSuccess, setRecordSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recordPage, setRecordPage] = useState(1); const recordPageSize = 6;
  const [formData, setFormData] = useState({
    serviceId: "",
    visitDate: new Date().toISOString().split("T")[0],
    complaint: "",
    observations: "",
    notes: ""
  });

  const fetchPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [patientResponse, recordsResponse, servicesResponse] = await Promise.all([
        fetch(apiUrl(`/api/patients/${id}`), { headers }),
        fetch(apiUrl(`/api/health-records/patient/${id}`), { headers }),
        fetch(apiUrl("/api/services"))
      ]);

      const [patientData, recordsData, servicesData] = await Promise.all([
        patientResponse.json(),
        recordsResponse.json(),
        servicesResponse.json()
      ]);

      if (!patientResponse.ok) {
        throw new Error(patientData.message || "Failed to load patient details.");
      }

      if (!recordsResponse.ok) {
        throw new Error(recordsData.message || "Failed to load health records.");
      }

      if (!servicesResponse.ok) {
        throw new Error(servicesData.message || "Failed to load available services.");
      }

      setPatient(patientData.data);
      setHealthRecords(recordsData.data || []);
      setServices(servicesData.data || []);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [currentUser, id]);

  useEffect(() => {
    if (currentUser && id) {
      // The data request updates state after its asynchronous API calls finish.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchPageData();
    }
  }, [currentUser, fetchPageData, id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value
    }));
  };

  const handleSubmitHealthRecord = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setRecordError("");
      setRecordSuccess("");

      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/health-records"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patientId: id, ...formData })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create health record.");
      }

      setRecordSuccess("Health record added successfully.");
      setFormData({
        serviceId: "",
        visitDate: new Date().toISOString().split("T")[0],
        complaint: "",
        observations: "",
        notes: ""
      });
      await fetchPageData();
    } catch (err) {
      setRecordError(err.message || "Unable to create health record.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <p>Loading patient details...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={() => navigate("/staff-patients")}>
          Back to Patients
        </button>
      </div>
    );
  }

  if (!patient) {
    return <p>Patient not found.</p>;
  }

  return (
    <div>
      <h2>Patient Details</h2>

      <button onClick={() => navigate("/staff-patients")}>
        Back to Patients
      </button>
      <button className="button-secondary" onClick={() => navigate(`/staff-patients/${id}/archive`)}>
        View Patient History
      </button>

      <hr />

      <h3>Personal Information</h3>
      <p><strong>Full Name:</strong> {patient.userId?.fullName || "N/A"}</p>
      <p><strong>Email:</strong> {patient.userId?.email || "N/A"}</p>
      <p><strong>Patient Number:</strong> {patient.patientNumber || "N/A"}</p>
      <p>
        <strong>Birth Date:</strong>{" "}
        {patient.birthDate
          ? new Date(patient.birthDate).toLocaleDateString()
          : "N/A"}
      </p>
      <p><strong>Sex:</strong> {patient.sex || "N/A"}</p>

      <h3>Contact Information</h3>
      <p><strong>Address:</strong> {patient.address || "N/A"}</p>
      <p><strong>Contact Number:</strong> {patient.contactNumber || "N/A"}</p>
      <p>
  <strong>Emergency Contact Name:</strong>{" "}
  {patient.emergencyContact?.name || "N/A"}
</p>

<p>
  <strong>Relationship:</strong>{" "}
  {patient.emergencyContact?.relationship || "N/A"}
</p>

<p>
  <strong>Emergency Contact Number:</strong>{" "}
  {patient.emergencyContact?.contactNumber || "N/A"}
</p>

      <hr />

      <h3>Add Health Record</h3>

      <form onSubmit={handleSubmitHealthRecord}>
        <div>
          <label htmlFor="serviceId">Service</label><br />
          <select
            id="serviceId"
            name="serviceId"
            value={formData.serviceId}
            onChange={handleChange}
            required
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.serviceName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="visitDate">Visit Date</label><br />
          <input
            id="visitDate"
            name="visitDate"
            type="date"
            value={formData.visitDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="complaint">Chief Complaint</label><br />
          <textarea
            id="complaint"
            name="complaint"
            value={formData.complaint}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="observations">Observations</label><br />
          <textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="notes">Notes</label><br />
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={submitting || services.length === 0}>
          {submitting ? "Saving..." : "Save Health Record"}
        </button>
      </form>

      {services.length === 0 && !loading && (
        <p>No available services found. Add a service before creating a health record.</p>
      )}

      {recordError && <p style={{ color: "red" }}>{recordError}</p>}
      {recordSuccess && <p style={{ color: "green" }}>{recordSuccess}</p>}

      <hr />

      <h3>Health Record History</h3>

      {healthRecords.length === 0 ? (
        <p>No health records found for this patient.</p>
      ) : (
        healthRecords.slice((recordPage - 1) * recordPageSize, recordPage * recordPageSize).map((record) => (
          <section key={record._id}>
            <p><strong>Visit Date:</strong> {formatDate(record.visitDate)}</p>
            <p><strong>Service:</strong> {record.serviceId?.serviceName || "N/A"}</p>
            <p><strong>Chief Complaint:</strong> {record.complaint}</p>
            <p><strong>Observations:</strong> {record.observations || "None recorded"}</p>
            <p><strong>Notes:</strong> {record.notes || "None recorded"}</p>
            <p><strong>Recorded By:</strong> {record.staffId?.fullName || "N/A"}</p>
            <hr />
          </section>
        ))
      )}<Pagination page={recordPage} totalItems={healthRecords.length} pageSize={recordPageSize} onPageChange={setRecordPage} />
    </div>
  );
}

export default StaffPatientDetails;
