import { PageHeader } from "../components/UI";
import AnnouncementFeed from "../components/AnnouncementFeed";
import { useAuth } from "../context/useAuth";
export default function PatientDashboard() { const { currentUser, userProfile } = useAuth(); return <div><PageHeader title="Health Center Feed" description={`Welcome, ${userProfile?.fullName || currentUser?.displayName || "Patient"}. Read the latest health center announcements.`} /><AnnouncementFeed /></div>; }
