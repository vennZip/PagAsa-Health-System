import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfile from "./pages/PatientProfile";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import AccountSettings from "./pages/AccountSettings";
import Appointments from "./pages/Appointments";
import StaffAppointments from "./pages/StaffAppointments";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import StaffDashboard from "./pages/StaffDashboard";
import StaffPatients from "./pages/StaffPatients";
import StaffPatientDetails from "./pages/StaffPatientDetails";
import QueueManagement from "./pages/QueueManagement";
import MyQueueStatus from "./pages/MyQueueStatus";
import InventoryManagement from "./pages/InventoryManagement";
import MyNotifications from "./pages/MyNotifications";
import ServiceManagement from "./pages/ServiceManagement";
import ActivityLogs from "./pages/ActivityLogs";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import AppLayout from "./components/AppLayout";

import { useAuth } from "./context/useAuth";

// Protect routes based on authentication and user role
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role } = useAuth();

  // Redirect users who are not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait for the MongoDB role to become available
  if (!role) {
    return <p>Loading user permissions...</p>;
  }

  // Check whether the user's role is authorized
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AppContent() {
  const { currentUser, role } = useAuth();

  return (
    <Routes>
      {/* Home */}
      <Route
        path="/"
        element={
          currentUser
            ? <Navigate to="/dashboard" replace />
            : <Navigate to="/login" replace />
        }
      />

      {/* Registration */}
      <Route
        path="/register"
        element={
          currentUser
            ? <Navigate to="/dashboard" replace />
            : <Register />
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          currentUser
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      {/* Dashboard */}
<Route
  path="/dashboard"
  element={
    currentUser ? (
      role ? (
        role === "admin" ? (
          <AppLayout><AdminDashboard /></AppLayout>
        ) : role === "staff" ? (
          <AppLayout><StaffDashboard /></AppLayout>
        ) : (
          <AppLayout><PatientDashboard /></AppLayout>
        )
      ) : (
        <p>Loading user permissions...</p>
      )
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

      {/* Patient Profile */}
      <Route
        path="/account-settings"
        element={
          <ProtectedRoute allowedRoles={["patient", "staff", "admin"]}>
            <AccountSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />

      {/* View My Profile */}
      <Route
        path="/my-profile"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyProfile />
          </ProtectedRoute>
        }
      />

      {/* Edit My Profile */}
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <EditProfile />
          </ProtectedRoute>
        }
      />

      {/* Patient Appointments */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <Appointments />
          </ProtectedRoute>
        }
      />

      {/* Staff/Admin Appointment Management */}
      <Route
        path="/staff-appointments"
        element={
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <StaffAppointments />
          </ProtectedRoute>
        }
      />

      {/* Staff/Admin Patient Management */}
<Route
  path="/staff-patients"
  element={
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <StaffPatients />
    </ProtectedRoute>
  }
/>

<Route
  path="/staff-patients/:id"
  element={
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <StaffPatientDetails />
    </ProtectedRoute>
  }
/>

      {/* Staff/Admin Queue Management */}
      <Route
        path="/queue-management"
        element={
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <QueueManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-queue"
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <MyQueueStatus />
          </ProtectedRoute>
        }
      />
      <Route path="/inventory" element={<ProtectedRoute allowedRoles={["admin", "staff"]}><InventoryManagement /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute allowedRoles={["patient", "staff", "admin"]}><MyNotifications /></ProtectedRoute>} />
      <Route path="/services-management" element={<ProtectedRoute allowedRoles={["admin"]}><ServiceManagement /></ProtectedRoute>} />
      <Route path="/activity-logs" element={<ProtectedRoute allowedRoles={["admin"]}><ActivityLogs /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin"]}><ReportsAnalytics /></ProtectedRoute>} />

      {/* Admin User Management */}
<Route
  path="/admin/users"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminUsers />
    </ProtectedRoute>
  }
/>

      {/* Unknown pages */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
