import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { PageHeader, StatCard } from "../components/UI";

function PatientDashboard() {
  const { currentUser, userProfile } = useAuth(); const navigate = useNavigate();
  return <div><PageHeader title={`Welcome, ${userProfile?.fullName || currentUser?.displayName || "Patient"}`} description="Manage your profile, appointments, queue status, and health center updates." /><div className="stat-grid"><StatCard icon="calendar" label="Appointments" value="My Care" tone="blue" detail="Request or review visits" /><StatCard icon="queue" label="Queue Status" value="Today" tone="green" detail="Check your ticket" /><StatCard icon="bell" label="Notifications" value="Updates" tone="orange" detail="Stay informed" /></div><div className="dashboard-grid"><section><h2>Your Health Center Services</h2><p>Quick access to your most important information.</p><div className="quick-actions"><button onClick={() => navigate("/appointments")}>My Appointments</button><button onClick={() => navigate("/my-queue")}>My Queue Status</button><button onClick={() => navigate("/my-profile")}>My Profile</button><button onClick={() => navigate("/notifications")}>Notifications</button></div></section><section><h2>Profile Setup</h2><p>Keep your contact and emergency information current for better care.</p><div className="quick-actions"><button onClick={() => navigate("/profile")}>Complete Profile</button><button onClick={() => navigate("/edit-profile")}>Edit Profile</button></div></section></div></div>;
}
export default PatientDashboard;
