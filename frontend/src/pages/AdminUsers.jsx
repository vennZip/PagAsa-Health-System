import { apiUrl } from "../config/api";
import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader, StatusBadge, Alert, Pagination } from "../components/UI";
import ConfirmDialog from "../components/ConfirmDialog";
import AdminPasswordDialog from "../components/AdminPasswordDialog";

function AdminUsers() {
  const { currentUser, userProfile, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = ["staff", "admin"].includes(searchParams.get("role")) ? searchParams.get("role") : "patient";
  const categoryLabel = { patient: "Users", staff: "Staffs", admin: "Admins" }[category];

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingChange, setPendingChange] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [resetError, setResetError] = useState("");
  const [passwordTarget, setPasswordTarget] = useState(null);
  const pageSize = 10;
  const filteredUsers = users.filter((user) => user.role === category && `${user.fullName} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const visiblePage = Math.min(page, Math.max(1, Math.ceil(filteredUsers.length / pageSize)));

  
const handleRoleChange = async (userId, newRole) => {
  try {
    setActionLoading(true); setError(""); setNotice("");
    const token = await currentUser.getIdToken();

    const response = await fetch(
      apiUrl(`/api/users/${userId}/role`),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update user role.");
    }

    setNotice("User role updated successfully.");
    setPendingChange(null);
    fetchUsers();

  } catch (error) {
    setError(error.message);
    fetchUsers();
  } finally { setActionLoading(false); }
};

const handleStatusChange = async (userId, newStatus) => {
  try {
    setActionLoading(true); setError(""); setNotice("");
    const token = await currentUser.getIdToken();

    const response = await fetch(
      apiUrl(`/api/users/${userId}/status`),
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, statusRemark: pendingChange?.remark || "" })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update account status."
      );
    }

    setNotice("Account status updated successfully.");
    setPendingChange(null);
    fetchUsers();

  } catch (error) {
    setError(error.message);
    fetchUsers();
  } finally { setActionLoading(false); }
};

const confirmPendingChange = () => {
  if (!pendingChange) return;
  if (pendingChange.type === "role") handleRoleChange(pendingChange.user._id, pendingChange.value);
  else if (pendingChange.type === "password-reset") handlePasswordReset(pendingChange.user);
  else handleStatusChange(pendingChange.user._id, pendingChange.value);
};

const handlePasswordReset = async (user) => {
  if (actionLoading) return;
  setActionLoading(true);
  setResetError("");
  setNotice("");
  try {
    await resetPassword(user.email);
    setNotice(`Password reset email requested for ${user.email}. Ask the account owner to check their inbox and spam folder.`);
    setPendingChange(null);
  } catch (resetError) {
    setResetError(resetError.code === "auth/too-many-requests"
      ? "Too many reset requests. Please wait before trying again."
      : resetError.code === "auth/network-request-failed"
        ? "Unable to connect. Check your internet connection and try again."
        : "Unable to send the password reset email. Please try again.");
  } finally {
    setActionLoading(false);
  }
};

  const fetchUsers = async () => {
    try {
      const token = await currentUser.getIdToken();

      const response = await fetch(
        apiUrl("/api/users"),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to retrieve users."
        );
      }

      setUsers(result.data);

    } catch (error) {
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <div className="dashboard-container">
      <PageHeader title={`${categoryLabel} Management`} description="Manage accounts, roles, and access status by category." actions={<><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button><button onClick={fetchUsers}>Refresh Users</button></>} />
      <div className="section-switcher" aria-label="Account category">{[["patient", "Users"], ["staff", "Staffs"], ["admin", "Admins"]].map(([value, label]) => <button type="button" key={value} aria-pressed={category === value} onClick={() => { setPage(1); navigate(`/admin/users?role=${value}`); }}>{label} ({users.filter((user) => user.role === value).length})</button>)}</div>

      {loading && <p>Loading users...</p>}

      {error && <Alert>{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      {!loading && !error && (
        <>
          <section><div className="page-header"><div><h2>Registered {categoryLabel}</h2><p>{filteredUsers.length} matching accounts.</p></div><div style={{ minWidth: "230px" }}><input aria-label="Search users" placeholder="Search name or email..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div></div>

          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Inactive Remark</th>
                <th>Password</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.slice((visiblePage - 1) * pageSize, visiblePage * pageSize).map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
  <select
    value={user.role}
    onChange={(e) =>
      setPendingChange({ type: "role", user, value: e.target.value })
    }
    disabled={user._id === userProfile?._id}
  >
    <option value="patient">Patient</option>
    <option value="staff">Staff</option>
    <option value="admin">Admin</option>
  </select>
</td>
                  <td>
                    <StatusBadge status={user.status} />
  <select
    value={user.status}
    onChange={(e) =>
      setPendingChange({ type: "status", user, value: e.target.value, remark: user.statusRemark || "" })
    }
    disabled={user._id === userProfile?._id}
  >
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</td>
                  <td className="account-status-remark">{user.status === "inactive" ? <>{user.statusRemark || "No remark provided"} <button type="button" onClick={() => setPendingChange({ type: "status", user, value: "inactive", remark: user.statusRemark || "" })}>Edit Remark</button></> : "—"}</td>
                  <td><div className="account-password-actions"><button type="button" disabled={actionLoading || user._id === userProfile?._id} title={user._id === userProfile?._id ? "Change your own password in profile settings" : undefined} aria-label={`Set password for ${user.fullName}`} onClick={() => setPasswordTarget(user)}>Set Password</button><button type="button" disabled={actionLoading || !user.email} aria-label={`Send password reset email to ${user.fullName}`} onClick={() => { setResetError(""); setPendingChange({ type: "password-reset", user }); }}>Send Reset Email</button></div></td>
                </tr>
              ))}
              {!filteredUsers.length && <tr><td colSpan="6">No accounts found in this category.</td></tr>}
            </tbody>
          </table><Pagination page={visiblePage} totalItems={filteredUsers.length} pageSize={pageSize} onPageChange={setPage} /></section>
        </>
      )}
      <ConfirmDialog open={Boolean(pendingChange)} title={pendingChange?.type === "password-reset" ? "Send Password Reset Email" : pendingChange?.type === "role" ? "Change User Role" : "Change Account Status"} confirmLabel={pendingChange?.type === "password-reset" ? "Send Reset Link" : "Confirm Change"} danger={pendingChange?.type === "status" && pendingChange?.value === "inactive"} busy={actionLoading} onCancel={() => setPendingChange(null)} onConfirm={confirmPendingChange}>
        <p>{pendingChange?.type === "password-reset" ? "Send a password reset link to this account's registered email. The account owner will choose a new password using the link." : "Confirm this account change before it is applied."}</p>
        <div className="review-list"><p><strong>User:</strong> {pendingChange?.user?.fullName}</p>{pendingChange?.type === "password-reset" ? <p><strong>Email:</strong> {pendingChange.user.email}</p> : <p><strong>{pendingChange?.type === "role" ? "New role" : "New status"}:</strong> {pendingChange?.value}</p>}</div>
        {pendingChange?.type === "password-reset" && resetError && <div role="alert"><Alert>{resetError}</Alert></div>}
        {pendingChange?.type === "status" && pendingChange.value === "inactive" && <div><label htmlFor="inactive-remark">Reason for inactive status (optional)</label><textarea id="inactive-remark" value={pendingChange.remark} maxLength={500} rows={3} onChange={(event) => setPendingChange({ ...pendingChange, remark: event.target.value })} placeholder="Explain why this account is inactive" /><small>{pendingChange.remark.length}/500 characters</small></div>}
      </ConfirmDialog>
      {passwordTarget && <AdminPasswordDialog key={passwordTarget._id} user={passwordTarget} onCancel={() => setPasswordTarget(null)} onSuccess={(message) => { setNotice(message); setPasswordTarget(null); }} />}
    </div>
  );
}

export default AdminUsers;
