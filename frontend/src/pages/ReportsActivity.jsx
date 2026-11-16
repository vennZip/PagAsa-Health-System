import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import ReportsAnalytics from "./ReportsAnalytics";
import ActivityLogs from "./ActivityLogs";

export default function ReportsActivity() {
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const showActivity = role === "admin" && params.get("view") === "activity";
  return <div>
    {role === "admin" && <div className="section-switcher" aria-label="Reports view">
      <button type="button" aria-pressed={!showActivity} onClick={() => setParams({ view: "reports" })}>Reports & Analytics</button>
      <button type="button" aria-pressed={showActivity} onClick={() => setParams({ view: "activity" })}>Activity Logs</button>
    </div>}
    {showActivity ? <ActivityLogs /> : <ReportsAnalytics />}
  </div>;
}
