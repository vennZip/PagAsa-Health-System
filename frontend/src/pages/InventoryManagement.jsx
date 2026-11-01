import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function InventoryManagement() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [medicineForm, setMedicineForm] = useState({ medicineName: "", unit: "", quantity: 0, minimumStock: 10, expirationDate: "" });
  const [transactionForm, setTransactionForm] = useState({ medicineId: "", transactionType: "stock-in", quantity: "", reason: "" });

  const loadMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/medicines"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load inventory.");
      setMedicines(data.data || []);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMedicines();
  }, [loadMedicines]);

  const submit = async (url, method, body, message) => {
    try {
      setError(""); setSuccess("");
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(`${url}`), { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Inventory action failed.");
      setSuccess(message || data.message);
      await loadMedicines();
    } catch (err) { setError(err.message); }
  };

  const addMedicine = (event) => {
    event.preventDefault();
    submit("/api/medicines", "POST", medicineForm, "Medicine added successfully.");
  };

  const recordTransaction = (event) => {
    event.preventDefault();
    submit(`/api/medicines/${transactionForm.medicineId}/transactions`, "POST", { ...transactionForm, quantity: Number(transactionForm.quantity) }, "Inventory updated successfully.");
    setTransactionForm({ medicineId: "", transactionType: "stock-in", quantity: "", reason: "" });
  };

  return <div>
    <h1>Medicine and Inventory Management</h1>
    <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
    <button onClick={loadMedicines} disabled={loading}>Refresh Inventory</button>
    {error && <p style={{ color: "red" }}>{error}</p>}{success && <p style={{ color: "green" }}>{success}</p>}
    <h2>Add Medicine</h2>
    <form onSubmit={addMedicine}>
      <input placeholder="Medicine name" required value={medicineForm.medicineName} onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })} />
      <input placeholder="Unit (e.g., tablets)" required value={medicineForm.unit} onChange={(e) => setMedicineForm({ ...medicineForm, unit: e.target.value })} />
      <input type="number" min="0" placeholder="Starting quantity" value={medicineForm.quantity} onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })} />
      <input type="number" min="0" placeholder="Minimum stock" value={medicineForm.minimumStock} onChange={(e) => setMedicineForm({ ...medicineForm, minimumStock: e.target.value })} />
      <input type="date" value={medicineForm.expirationDate} onChange={(e) => setMedicineForm({ ...medicineForm, expirationDate: e.target.value })} />
      <button type="submit">Add Medicine</button>
    </form>
    <h2>Record Inventory Transaction</h2>
    <form onSubmit={recordTransaction}>
      <select required value={transactionForm.medicineId} onChange={(e) => setTransactionForm({ ...transactionForm, medicineId: e.target.value })}><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine._id} value={medicine._id}>{medicine.medicineName}</option>)}</select>
      <select value={transactionForm.transactionType} onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}><option value="stock-in">Stock in</option><option value="stock-out">Stock out</option><option value="adjustment">Adjustment</option><option value="expired">Expired</option></select>
      <input required type="number" min="1" placeholder="Quantity" value={transactionForm.quantity} onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })} />
      <input required placeholder="Reason" value={transactionForm.reason} onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })} />
      <button type="submit">Save Transaction</button>
    </form>
    <h2>Current Inventory</h2>
    {loading ? <p>Loading inventory...</p> : <table border="1" cellPadding="10"><thead><tr><th>Medicine</th><th>Quantity</th><th>Unit</th><th>Status</th><th>Expiration</th></tr></thead><tbody>{medicines.length ? medicines.map((medicine) => <tr key={medicine._id}><td>{medicine.medicineName}</td><td>{medicine.quantity}</td><td>{medicine.unit}</td><td>{medicine.status}</td><td>{medicine.expirationDate ? new Date(medicine.expirationDate).toLocaleDateString() : "N/A"}</td></tr>) : <tr><td colSpan="5">No medicines found.</td></tr>}</tbody></table>}
  </div>;
}
export default InventoryManagement;
