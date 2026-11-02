import { PageHeader } from "../components/UI";
import AnnouncementFeed from "../components/AnnouncementFeed";
import { useAuth } from "../context/useAuth";
export default function StaffDashboard() { const { userProfile } = useAuth(); return <div><PageHeader title="Health Center Feed" description={`Welcome back, ${userProfile?.fullName || "Staff Member"}. Follow the latest clinic announcements.`} /><AnnouncementFeed /></div>; }
