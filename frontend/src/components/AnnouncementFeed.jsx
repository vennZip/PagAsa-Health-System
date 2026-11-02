import { useCallback, useEffect, useRef, useState } from "react";
import { apiUrl } from "../config/api";
import { useAuth } from "../context/useAuth";
import { Pagination } from "./UI";
import ConfirmDialog from "./ConfirmDialog";

const PAGE_SIZE = 8;

export default function AnnouncementFeed() {
  const { currentUser, role } = useAuth();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageName, setImageName] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const imageInputRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/announcements"), { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setItems(data.data || []);
    } catch (err) { setError(err.message || "Unable to load announcements."); }
  }, [currentUser]);

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    load(); }, [load]);

  const post = async (event) => {
    event.preventDefault();
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl("/api/announcements"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message, imageData, imageAlt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessage(""); setImageData(""); setImageAlt(""); setImageName("");
      if (imageInputRef.current) imageInputRef.current.value = "";
      setPage(1); await load();
    } catch (err) { setError(err.message || "Unable to post announcement."); }
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    setError("");
    if (!file) { setImageData(""); setImageName(""); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG, or WebP image."); setImageData(""); setImageName(""); event.target.value = ""; return; }
    if (file.size > 1_000_000) { setError("The image must be 1 MB or smaller."); setImageData(""); setImageName(""); event.target.value = ""; return; }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageData(String(reader.result));
    reader.onerror = () => setError("Unable to read that image.");
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageData("");
    setImageAlt("");
    setImageName("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(apiUrl(`/api/announcements/${deleteTarget._id}`), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDeleteTarget(null);
      await load();
    } catch (err) { setError(err.message || "Unable to delete announcement."); }
    finally { setDeleting(false); }
  };

  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return <div className="announcement-feed">
    {role === "admin" && <form className="announcement-composer" onSubmit={post}><div><label htmlFor="announcement">Post a health center announcement</label><textarea id="announcement" value={message} onChange={(event) => setMessage(event.target.value)} maxLength="2000" placeholder="Share clinic news, schedule changes, or important reminders..." required /><span className="field-label">Add a picture <small>(optional)</small></span><div className="image-picker"><input ref={imageInputRef} className="visually-hidden-file" id="announcement-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} /><label className="image-picker-button" htmlFor="announcement-image"><span aria-hidden="true">＋</span>{imageName ? "Change Picture" : "Choose Picture"}</label><span className="image-picker-name" aria-live="polite">{imageName || "No picture selected"}</span>{imageName && <button type="button" className="image-picker-remove" onClick={clearImage}>Remove</button>}</div><small className="field-help">JPG, PNG, or WebP; maximum 1 MB.</small>{imageData && <><img className="announcement-preview" src={imageData} alt="Selected announcement preview" /><label htmlFor="announcement-image-alt">Picture description</label><input id="announcement-image-alt" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} maxLength="180" placeholder="Describe the picture for accessibility" /></>}</div><button type="submit">Post Announcement</button></form>}
    {error && <p className="alert alert--error">{error}</p>}
    <div className="feed-list">{visible.length ? visible.map((item) => <article className="feed-card" key={item._id}><div className="feed-author"><strong>{item.authorId?.fullName || "Barangay Pag-Asa Health Center"}</strong><span>{new Date(item.createdAt).toLocaleString("en-PH")}</span></div><p>{item.message}</p>{item.imageData && <img className="announcement-image" src={item.imageData} alt={item.imageAlt || "Health center announcement"} />}{role === "admin" && <button className="danger-text-button" type="button" onClick={() => setDeleteTarget(item)}>Delete</button>}</article>) : <section><h2>No announcements yet</h2><p>Health center updates will appear here.</p></section>}</div>
    <Pagination page={page} totalItems={items.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    <ConfirmDialog open={Boolean(deleteTarget)} title="Delete Announcement" confirmLabel="Delete Announcement" danger busy={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={remove}><p>This announcement will be permanently removed from every user&apos;s dashboard.</p><div className="review-list"><p>{deleteTarget?.message}</p></div></ConfirmDialog>
  </div>;
}
