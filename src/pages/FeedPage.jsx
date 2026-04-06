import { useState, useEffect, useRef } from "react";
import { apiGetItems, apiResolveItem } from "../services/api.js";
import manipalLogo from "../assets/manipal-logo.jpeg";
import "../styles/FeedPage.css";

const CATEGORIES = [
  { key: "all",     label: "All" },
  { key: "phone",   label: "Phone" },
  { key: "keys",    label: "Keys" },
  { key: "wallet",  label: "Wallet" },
  { key: "laptop",  label: "Laptop" },
  { key: "id_card", label: "ID Card" },
  { key: "airpods", label: "AirPods" },
  { key: "bag",     label: "Bag" },
  { key: "other",   label: "Other" },
];

/* ── SVG Icons — clean, consistent stroke icons ─────────────────────────── */
const Icon = {
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Whatsapp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  Search: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  Warning: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  Clock: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return `${diff}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function fmt(str) {
  return str.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="card card--skeleton" aria-hidden="true">
      <div className="card-img-wrap">
        <div className="shimmer-block" />
      </div>
      <div className="card-body">
        <div className="sk" style={{ width: "40%", height: 8 }} />
        <div className="sk" style={{ width: "88%", height: 12, marginTop: 8 }} />
        <div className="sk" style={{ width: "60%", height: 12, marginTop: 4 }} />
        <div className="sk" style={{ width: "35%", height: 8, marginTop: 16 }} />
      </div>
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────────────── */
function ItemModal({ item, onClose, onResolved }) {
  const [resolving, setResolving] = useState(false);
  const [resolved,  setResolved]  = useState(item.status === "resolved");
  const [imgLoaded, setImgLoaded] = useState(false);
  const ref = useRef(null);

  // Check if the current user created this post (matched by saved phones)
  const myPhones = JSON.parse(localStorage.getItem("myPhones") || "[]");
  const isOwner  = myPhones.includes(item.contact_phone);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  const waUrl = `https://wa.me/91${item.contact_phone}?text=${encodeURIComponent(
    `Hi, I saw your ${item.type} item (${item.category}) on MIT Manipal Lost & Found. Can we connect?`
  )}`;

  const handleResolve = async () => {
    if (!confirm("Mark as resolved? This removes it from the feed.")) return;
    setResolving(true);
    try {
      await apiResolveItem(item.id);
      setResolved(true);
      onResolved(item.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="modal-overlay" ref={ref} onClick={e => e.target === ref.current && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        {/* Handle bar for mobile */}
        <div className="modal-handle"><span /></div>

        {/* Image */}
        <div className="modal-visual">
          {!imgLoaded && <div className="modal-visual-skeleton shimmer-block" />}
          <img
            src={item.image_url}
            alt={item.description}
            className={`modal-photo ${imgLoaded ? "loaded" : ""}`}
            onLoad={() => setImgLoaded(true)}
          />
          <div className="modal-gradient" />
          <span className={`badge badge--${item.type}`}>
            {item.type === "lost" ? "Lost" : "Found"}
          </span>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <span className="modal-label">{fmt(item.category)}</span>
          <p className="modal-desc">{item.description}</p>

          <div className="modal-meta">
            <span className="modal-meta-item">
              <Icon.Clock />
              {fmtDate(item.created_at)}
            </span>
          </div>

          {item.note && (
            <div className="modal-note">
              <p>{item.note}</p>
            </div>
          )}

          <div className="modal-sep" />

          <div className="modal-cta">
            {resolved ? (
              <div className="modal-resolved">
                <Icon.Check />
                <span>Resolved</span>
              </div>
            ) : (
              <>
                <a className="cta-btn cta-btn--wa" href={waUrl} target="_blank" rel="noreferrer">
                  <Icon.Whatsapp />
                  WhatsApp
                </a>
                {isOwner && (
                  <button className="cta-btn cta-btn--secondary" onClick={handleResolve} disabled={resolving}>
                    {resolving ? <span className="spin" /> : <><Icon.Check /> Resolve</>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Item Card ────────────────────────────────────────────────────────────── */
function ItemCard({ item, onClick, index }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article
      className="card"
      onClick={() => onClick(item)}
      style={{ animationDelay: `${Math.min(index * 35, 280)}ms` }}
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick(item)}
    >
      <div className="card-img-wrap">
        {!imgLoaded && <div className="card-img-sk shimmer-block" />}
        <img
          src={item.image_url}
          alt={item.description}
          className={`card-photo ${imgLoaded ? "loaded" : ""}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        {item.status === "resolved" && (
          <div className="card-resolved"><Icon.Check /><span>Resolved</span></div>
        )}
        <span className={`badge badge--${item.type}`}>
          {item.type === "lost" ? "Lost" : "Found"}
        </span>
      </div>

      <div className="card-body">
        <span className="card-cat">{fmt(item.category)}</span>
        <p className="card-desc">{item.description}</p>
        <span className="card-time">
          <Icon.Clock />
          {fmtDate(item.created_at)}
        </span>
      </div>
    </article>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function FeedPage({ onPostClick }) {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [activeType, setActiveType] = useState("all");
  const [activeCat,  setActiveCat]  = useState("all");
  const [selected,   setSelected]   = useState(null);

  const fetchItems = async () => {
    setLoading(true); setError("");
    try {
      setItems(await apiGetItems({
        type:     activeType !== "all" ? activeType : undefined,
        category: activeCat  !== "all" ? activeCat  : undefined,
      }));
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [activeType, activeCat]);

  const handleResolved = id => { setItems(p => p.filter(i => i.id !== id)); setSelected(null); };
  const lostCount  = items.filter(i => i.type === "lost").length;
  const foundCount = items.filter(i => i.type === "found").length;

  return (
    <div className="shell">
      {/* ── Top bar ── */}
      <header className="header" id="feed-topbar">
        <div className="header-brand">
          <div className="header-logo" aria-label="Lost and Found">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2"/>
              <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10.5 7.5V10.5H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="header-text">
            <h1 className="header-title">Lost & Found</h1>
            <img src={manipalLogo} alt="MAHE" className="header-mahe" />
          </div>
        </div>
        <button className="header-action" id="post-item-btn" onClick={onPostClick}>
          <Icon.Plus />
          <span className="header-action-label">Post</span>
        </button>
      </header>

      {/* ── Filters ── */}
      <nav className="filter-bar" id="feed-filters">
        {/* Type segmented control */}
        <div className="seg">
          {[
            { key: "all",   label: "All",   count: items.length },
            { key: "lost",  label: "Lost",  count: lostCount },
            { key: "found", label: "Found", count: foundCount },
          ].map(t => (
            <button
              key={t.key}
              className={`seg-btn ${activeType === t.key ? `seg-btn--on seg-btn--${t.key}` : ""}`}
              onClick={() => setActiveType(t.key)}
              id={`filter-type-${t.key}`}
            >
              {t.label}
              {!loading && <span className="seg-count">{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Category strip */}
        <div className="cats">
          {CATEGORIES.map(c => (
            <button
              key={c.key}
              className={`cat ${activeCat === c.key ? "cat--on" : ""}`}
              onClick={() => setActiveCat(c.key)}
              id={`filter-cat-${c.key}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Feed ── */}
      <main className="feed">
        {loading ? (
          <div className="grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="empty" id="feed-error-state">
            <div className="empty-icon empty-icon--err"><Icon.Warning /></div>
            <p className="empty-heading">Something went wrong</p>
            <p className="empty-sub">{error}</p>
            <button className="ghost-btn" onClick={fetchItems}>Retry</button>
          </div>
        ) : items.length === 0 ? (
          <div className="empty" id="feed-empty-state">
            <div className="empty-icon"><Icon.Search /></div>
            <p className="empty-heading">No items yet</p>
            <p className="empty-sub">
              {activeType !== "all" || activeCat !== "all"
                ? "Try changing the filters above"
                : "Post the first lost or found item"}
            </p>
            {(activeType !== "all" || activeCat !== "all") && (
              <button className="ghost-btn" onClick={() => { setActiveType("all"); setActiveCat("all"); }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid">
            {items.map((item, i) => (
              <ItemCard key={item.id} item={item} onClick={setSelected} index={i} />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <ItemModal item={selected} onClose={() => setSelected(null)} onResolved={handleResolved} />
      )}
    </div>
  );
}