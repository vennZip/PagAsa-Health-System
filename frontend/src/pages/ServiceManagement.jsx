import { apiUrl } from "../config/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";
import { Alert, PageHeader, Pagination, StatusBadge } from "../components/UI";

const categories = ["Consultation", "Maternal Care", "Child Care", "Immunization", "Health Education", "Other"];
const emptyForm = { serviceName: "", category: "Consultation", description: "", requirements: "", availability: "available" };

export default function ServiceManagement() {
  const { currentUser } = useAuth();
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/services/manage"), { headers: { Authorization: "Bearer " + token } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setServices(data.data || []);
    } catch (err) { setError(err.message || "Unable to load services."); }
    finally { setLoading(false); }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const reset = () => { setEditingId(null); setForm(emptyForm); };
  const edit = (service) => {
    setEditingId(service._id);
    setForm({ serviceName: service.serviceName, category: service.category, description: service.description || "", requirements: (service.requirements || []).join("\n"), availability: service.availability });
    setError(""); setNotice("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    nameRef.current?.focus({ preventScroll: true });
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(editingId ? "/api/services/" + editingId : "/api/services"), {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ ...form, serviceName: form.serviceName.trim(), requirements: form.requirements.split("\n").map((value) => value.trim()).filter(Boolean) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save service.");
      setNotice(editingId ? "Service updated successfully." : "Service added successfully.");
      reset();
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  return <div>
    <PageHeader title="Health Center Services" description="Add services and edit their details or availability at any time." />
    {error && <Alert>{error}</Alert>}
    {notice && <Alert type="success">{notice}</Alert>}
    <section ref={formRef}>
      <h2>{editingId ? "Edit Service" : "Add Service"}</h2>
      <form onSubmit={save}>
        <fieldset disabled={saving} className="service-form-fields">
          <div><label htmlFor="service-name">Service Name</label><input ref={nameRef} id="service-name" name="serviceName" required pattern=".*\S.*" value={form.serviceName} onChange={change} /></div>
          <div><label htmlFor="service-category">Category</label><select id="service-category" name="category" value={form.category} onChange={change}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <div><label htmlFor="service-description">Description</label><textarea id="service-description" name="description" rows={3} value={form.description} onChange={change} /></div>
          <div><label htmlFor="service-requirements">Requirements (one per line)</label><textarea id="service-requirements" name="requirements" rows={3} value={form.requirements} onChange={change} /></div>
          <div><label htmlFor="service-availability">Availability</label><select id="service-availability" name="availability" value={form.availability} onChange={change}><option value="available">Available</option><option value="unavailable">Unavailable</option></select></div>
          <div className="service-form-actions"><button type="submit">{saving ? "Saving..." : editingId ? "Save Changes" : "Add Service"}</button>{editingId && <button type="button" onClick={reset}>Cancel Editing</button>}</div>
        </fieldset>
      </form>
    </section>
    <section><h2>All Services</h2>
      {loading ? <p>Loading services...</p> : <>
        <table><thead><tr><th>Service</th><th>Category</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{services.slice((page - 1) * pageSize, page * pageSize).map((service) => <tr key={service._id}><td><strong>{service.serviceName}</strong><p>{service.description}</p></td><td>{service.category}</td><td><StatusBadge status={service.availability} /></td><td><button type="button" disabled={saving} onClick={() => edit(service)}>Edit Service</button></td></tr>)}{!services.length && <tr><td colSpan="4">No services added yet.</td></tr>}</tbody>
        </table>
        <Pagination page={page} totalItems={services.length} pageSize={pageSize} onPageChange={setPage} />
      </>}
    </section>
  </div>;
}
