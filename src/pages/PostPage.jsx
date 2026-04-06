import { useState, useRef } from "react";
import { apiUploadImage, apiCreateItem } from "../services/api.js";
import "../styles/PostPage.css";

const CATS = [
  { key: "phone",   label: "Phone" },
  { key: "keys",    label: "Keys" },
  { key: "wallet",  label: "Wallet" },
  { key: "laptop",  label: "Laptop" },
  { key: "id_card", label: "ID Card" },
  { key: "airpods", label: "AirPods" },
  { key: "bag",     label: "Bag" },
  { key: "other",   label: "Other" },
];

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
const Ico = {
  Back: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  Camera: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Check: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

export default function PostPage({ onBack }) {
  const fileRef = useRef();

  const [form, setForm] = useState({
    type: "", category: "", description: "", contact_phone: "", note: "",
  });
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [errors,     setErrors]     = useState({});
  const [srvErr,     setSrvErr]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
    setSrvErr("");
  };

  const handleImg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(e => ({ ...e, image: "Image must be under 5 MB" }));
      return;
    }
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setErrors(e => ({ ...e, image: "" }));
  };

  const validate = () => {
    const e = {};
    if (!imgFile)                              e.image       = "Add a photo";
    if (!form.type)                            e.type        = "Select Lost or Found";
    if (!form.category)                        e.category    = "Pick a category";
    if (form.description.trim().length < 10)   e.description = "At least 10 characters";
    if (!/^\d{10}$/.test(form.contact_phone))  e.phone       = "Enter 10-digit number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setSrvErr("");
    try {
      setUploading(true);
      const { url } = await apiUploadImage(imgFile);
      setUploading(false);

      await apiCreateItem({
        ...form,
        image_url:   url,
        description: form.description.trim(),
        note:        form.note.trim() || null,
      });

      setDone(true);
    } catch (err) {
      setSrvErr(err.message);
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ type: "", category: "", description: "", contact_phone: "", note: "" });
    setImgFile(null); setImgPreview(null);
    setErrors({}); setSrvErr(""); setDone(false);
  };

  /* ── Success ───────────────────────────────────────────────────────────── */
  if (done) return (
    <div className="post-success-shell">
      <div className="post-success-card">
        <div className="post-success-icon">
          <Ico.Check />
        </div>
        <p className="post-success-title">
          {form.type === "lost" ? "Posted successfully" : "You're awesome"}
        </p>
        <p className="post-success-sub">
          Your item is live on the board.
          Students will reach out via WhatsApp.
        </p>
        <button className="post-primary-btn" onClick={onBack}>Back to feed</button>
        <button className="post-ghost-btn" onClick={reset}>Post another</button>
      </div>
    </div>
  );

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <div className="post-shell">

      {/* Nav */}
      <header className="post-header">
        <button className="post-back" onClick={onBack} aria-label="Go back">
          <Ico.Back />
        </button>
        <p className="post-header-title">New Post</p>
        <div style={{ width: 36 }} />
      </header>

      <div className="post-scroll">

        {/* Image upload */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />

        <div
          className={`post-img-zone ${imgPreview ? "post-img-zone--filled" : ""}`}
          onClick={() => fileRef.current?.click()}
        >
          {imgPreview ? (
            <>
              <img src={imgPreview} alt="Preview" className="post-img-preview" />
              <div className="post-img-overlay">
                <Ico.Camera />
                <span>Change photo</span>
              </div>
            </>
          ) : (
            <>
              <Ico.Camera />
              <span className="post-img-label">Add a photo</span>
              <span className="post-img-hint">JPEG, PNG, WebP — max 5 MB</span>
            </>
          )}
          {uploading && (
            <div className="post-img-uploading">
              <div className="post-spinner" />
              <span>Uploading…</span>
            </div>
          )}
        </div>
        {errors.image && <p className="post-field-err" style={{ marginTop: -4 }}>{errors.image}</p>}

        {/* Type */}
        <fieldset className="post-section">
          <legend className="post-section-label">Lost or Found?</legend>
          <div className="post-type-row">
            {["lost", "found"].map(t => (
              <button
                key={t}
                className={`post-type-btn ${form.type === t ? `post-type-btn--${t}` : ""}`}
                onClick={() => setField("type", t)}
              >
                {t === "lost" ? "I lost it" : "I found it"}
              </button>
            ))}
          </div>
          {errors.type && <p className="post-field-err">{errors.type}</p>}
        </fieldset>

        {/* Category */}
        <fieldset className="post-section">
          <legend className="post-section-label">Category</legend>
          <div className="post-cat-grid">
            {CATS.map(c => (
              <button
                key={c.key}
                className={`post-cat-btn ${form.category === c.key ? "post-cat-btn--on" : ""}`}
                onClick={() => setField("category", c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {errors.category && <p className="post-field-err">{errors.category}</p>}
        </fieldset>

        {/* Details */}
        <fieldset className="post-section">
          <legend className="post-section-label">Details</legend>

          <div className="post-field">
            <label className="post-field-label">Description</label>
            <textarea
              rows={3}
              placeholder="Color, brand, where you lost/found it…"
              value={form.description}
              onChange={e => setField("description", e.target.value)}
              className={errors.description ? "post-input--err" : ""}
            />
            {errors.description && <p className="post-field-err">{errors.description}</p>}
          </div>

          <div className="post-field">
            <label className="post-field-label">WhatsApp Number</label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={form.contact_phone}
              onChange={e => setField("contact_phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={errors.phone ? "post-input--err" : ""}
            />
            {errors.phone && <p className="post-field-err">{errors.phone}</p>}
            <p className="post-field-hint">Others will contact you here</p>
          </div>

          <div className="post-field">
            <label className="post-field-label">Note <span>(optional)</span></label>
            <input
              type="text"
              placeholder='e.g. "Found near library gate"'
              value={form.note}
              onChange={e => setField("note", e.target.value)}
            />
          </div>
        </fieldset>

        {srvErr && <div className="post-srv-err">{srvErr}</div>}
      </div>

      {/* Submit */}
      <div className="post-footer">
        <button className="post-submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Posting…" : "Post Item"}
        </button>
      </div>
    </div>
  );
}