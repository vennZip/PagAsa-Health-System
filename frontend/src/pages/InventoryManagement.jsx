import { apiUrl } from "../config/api";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { exportDateStamp, exportToExcelCsv } from "../utils/exportCsv";
import { Pagination } from "../components/UI";

const EMPTY_MEDICINE_FORM = {
  medicineName: "",
  unit: "",
  quantity: 0,
  minimumStock: 10,
  expirationDate: ""
};

const EMPTY_TRANSACTION_FORM = {
  medicineId: "",
  transactionType: "stock-in",
  quantity: "",
  reason: ""
};

function InventoryManagement() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [medicineForm, setMedicineForm] = useState(EMPTY_MEDICINE_FORM);
  const [transactionForm, setTransactionForm] = useState(EMPTY_TRANSACTION_FORM);
  const [page, setPage] = useState(1); const pageSize = 10;

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
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const addMedicine = async (event) => {
    event.preventDefault();
    const added = await submit("/api/medicines", "POST", medicineForm, "Medicine added successfully.");
    if (added) setMedicineForm(EMPTY_MEDICINE_FORM);
  };

  const recordTransaction = async (event) => {
    event.preventDefault();
    const recorded = await submit(`/api/medicines/${transactionForm.medicineId}/transactions`, "POST", { ...transactionForm, quantity: Number(transactionForm.quantity) }, "Inventory updated successfully.");
    if (recorded) setTransactionForm(EMPTY_TRANSACTION_FORM);
  };

  const exportInventory = () => {
    exportToExcelCsv(
      `pagasa-medicine-inventory-${exportDateStamp()}.csv`,
      [
        { label: "Medicine", value: (medicine) => medicine.medicineName },
        { label: "Quantity", value: (medicine) => medicine.quantity },
        { label: "Unit", value: (medicine) => medicine.unit },
        { label: "Low-Stock Warning Level", value: (medicine) => medicine.minimumStock },
        { label: "Status", value: (medicine) => medicine.status },
        { label: "Expiration Date", value: (medicine) => medicine.expirationDate ? new Date(medicine.expirationDate).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }) : "N/A" }
      ],
      medicines
    );
  };

  return <div>
    <h1>Medicine and Inventory Management</h1>
    <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
    <button onClick={loadMedicines} disabled={loading}>Refresh Inventory</button>
    <button onClick={exportInventory} disabled={loading || medicines.length === 0}>Export for Excel</button>
    {error && <p style={{ color: "red" }}>{error}</p>}{success && <p style={{ color: "green" }}>{success}</p>}
    <h2>Add Medicine</h2>
    <form onSubmit={addMedicine}>
      <div><label>Medicine Name</label><input placeholder="e.g., Paracetamol" required value={medicineForm.medicineName} onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })} /></div>
      <div><label>Unit</label><input placeholder="e.g., tablets, bottles, boxes" required value={medicineForm.unit} onChange={(e) => setMedicineForm({ ...medicineForm, unit: e.target.value })} /></div>
      <div><label>Starting Quantity</label><input type="number" min="0" aria-describedby="starting-quantity-help" value={medicineForm.quantity} onChange={(e) => setMedicineForm({ ...medicineForm, quantity: e.target.value })} /><small id="starting-quantity-help">Number of units currently available. Use 0 if no stock is available yet.</small></div>
      <div><label>Low-Stock Warning Level</label><input type="number" min="0" aria-describedby="minimum-stock-help" value={medicineForm.minimumStock} onChange={(e) => setMedicineForm({ ...medicineForm, minimumStock: e.target.value })} /><small id="minimum-stock-help">The system marks this medicine as low stock at or below this number.</small></div>
      <div><label>Expiration Date</label><input type="date" value={medicineForm.expirationDate} onChange={(e) => setMedicineForm({ ...medicineForm, expirationDate: e.target.value })} /></div>
      <button type="submit">Add Medicine</button>
    </form>
    <h2>Record Inventory Transaction</h2>
    <form onSubmit={recordTransaction}>
      <div><label>Medicine</label><select required value={transactionForm.medicineId} onChange={(e) => setTransactionForm({ ...transactionForm, medicineId: e.target.value })}><option value="">Select medicine</option>{medicines.map((medicine) => <option key={medicine._id} value={medicine._id}>{medicine.medicineName}</option>)}</select></div>
      <div><label>Transaction Type</label><select value={transactionForm.transactionType} onChange={(e) => setTransactionForm({ ...transactionForm, transactionType: e.target.value })}><option value="stock-in">Stock in</option><option value="stock-out">Stock out</option><option value="adjustment">Adjustment</option><option value="expired">Expired</option></select></div>
      <div><label>Quantity</label><input required type="number" min="1" placeholder="Number of units" value={transactionForm.quantity} onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })} /></div>
      <div><label>Reason</label><input required placeholder="Why is the stock changing?" value={transactionForm.reason} onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })} /></div>
      <button type="submit">Save Transaction</button>
    </form>
    <h2>Current Inventory</h2>
    {loading ? <p>Loading inventory...</p> : <><table border="1" cellPadding="10"><thead><tr><th>Medicine</th><th>Quantity</th><th>Unit</th><th>Status</th><th>Expiration</th></tr></thead><tbody>{medicines.length ? medicines.slice((page - 1) * pageSize, page * pageSize).map((medicine) => <tr key={medicine._id}><td>{medicine.medicineName}</td><td>{medicine.quantity}</td><td>{medicine.unit}</td><td>{medicine.status}</td><td>{medicine.expirationDate ? new Date(medicine.expirationDate).toLocaleDateString() : "N/A"}</td></tr>) : <tr><td colSpan="5">No medicines found.</td></tr>}</tbody></table><Pagination page={page} totalItems={medicines.length} pageSize={pageSize} onPageChange={setPage} /></>}
  </div>;
}
export default InventoryManagement;
