import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { PageHeader, StatusBadge, Alert } from "../components/UI";

function AdminUsers() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  
const handleRoleChange = async (userId, newRole) => {
  try {
    const token = await currentUser.getIdToken();

    const response = await fetch(
      `http://localhost:5000/api/users/${userId}/role`,
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

    alert("User role updated successfully.");
    fetchUsers();

  } catch (error) {
    alert(error.message);
    fetchUsers();
  }
};

const handleStatusChange = async (userId, newStatus) => {
  const confirmed = window.confirm(
    `Are you sure you want to change this account status to ${newStatus}?`
  );

  if (!confirmed) {
    fetchUsers();
    return;
  }

  try {
    const token = await currentUser.getIdToken();

    const response = await fetch(
      `http://localhost:5000/api/users/${userId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to update account status."
      );
    }

    alert("Account status updated successfully.");
    fetchUsers();

  } catch (error) {
    alert(error.message);
    fetchUsers();
  }
};

  const fetchUsers = async () => {
    try {
      const token = await currentUser.getIdToken();

      const response = await fetch(
        "http://localhost:5000/api/users",
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
  }, [currentUser]);

  return (
    <div className="dashboard-container">
      <PageHeader title="User Management" description="Manage registered accounts, roles, and access status." actions={<><button onClick={() => navigate("/dashboard")}>Back to Dashboard</button><button onClick={fetchUsers}>Refresh Users</button></>} />

      {loading && <p>Loading users...</p>}

      {error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          <section><div className="page-header"><div><h2>Registered Users</h2><p>{users.length} accounts in the system.</p></div><div style={{ minWidth: "230px" }}><input aria-label="Search users" placeholder="Search name or email..." value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>

          <table border="1" cellPadding="10">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(search.toLowerCase())).map((user) => (
                <tr key={user._id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
  <select
    value={user.role}
    onChange={(e) =>
      handleRoleChange(user._id, e.target.value)
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
      handleStatusChange(user._id, e.target.value)
    }
    disabled={user._id === userProfile?._id}
  >
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</td>
                </tr>
              ))}
            </tbody>
          </table></section>
        </>
      )}
    </div>
  );
}

export default AdminUsers;
