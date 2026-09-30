import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, LogOut, X, Star, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/actualites")({
  component: AdminNewsPage,
});

const API = import.meta.env.VITE_API_URL ?? "http://localhost:9000";
const TOKEN_KEY = "ipisb_news_admin_token";

const PAL = {
  ink:    "oklch(22% 0.025 175)",
  text:   "oklch(34% 0.03 180)",
  muted:  "oklch(48% 0.02 180)",
  primary:"oklch(48% 0.085 175)",
  cream:  "oklch(97% 0.012 90)",
  paper:  "oklch(99% 0.005 160)",
  line:   "oklch(88% 0.015 170)",
  red:    "oklch(58% 0.19 25)",
  green:  "oklch(60% 0.13 150)",
};
const serif = '"Cormorant Garamond", Georgia, serif';
const sans  = '"Manrope", system-ui, sans-serif';
const mono  = '"JetBrains Mono", ui-monospace, monospace';

const CATEGORIES = [
  { id: "recherche",  label: "Recherche" },
  { id: "vie",        label: "Vie de l'école" },
  { id: "plateforme", label: "Plateforme" },
  { id: "evenement",  label: "Événement" },
];

interface Article {
  id: string;
  category: string;
  published: boolean;
  featured: boolean;
  image_url: string | null;
  published_at: string;
  read_time_minutes: number;
  title_fr: string; excerpt_fr: string;
  title_en: string | null; excerpt_en: string | null;
  title_ar: string | null; excerpt_ar: string | null;
}

const EMPTY_FORM = {
  category: "vie",
  published: true,
  featured: false,
  image_url: "",
  published_at: new Date().toISOString().slice(0, 10),
  read_time_minutes: 3,
  title_fr: "", excerpt_fr: "",
  title_en: "", excerpt_en: "",
  title_ar: "", excerpt_ar: "",
};

function inputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: `1px solid ${PAL.line}`, fontFamily: sans, fontSize: 13,
    color: PAL.ink, background: PAL.paper, outline: "none", boxSizing: "border-box",
    ...extra,
  };
}
function labelStyle(): React.CSSProperties {
  return { display: "block", fontFamily: sans, fontSize: 11, fontWeight: 700, color: PAL.muted, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: ".04em" };
}

function LoginForm({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/news/admin/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError("Email ou mot de passe incorrect."); return; }
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      onSuccess(data.token);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PAL.cream, padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ background: PAL.paper, border: `1px solid ${PAL.line}`, borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: PAL.primary, letterSpacing: ".14em", textTransform: "uppercase" as const, fontWeight: 600 }}>§ Admin</div>
        <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: 30, color: PAL.ink, margin: "10px 0 24px" }}>Actualités</h1>
        <label style={labelStyle()}>Email</label>
        <input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} style={inputStyle({ marginBottom: 14 })} />
        <label style={labelStyle()}>Mot de passe</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle({ marginBottom: 14 })} />
        {error && <p style={{ fontFamily: sans, fontSize: 12, color: PAL.red, margin: "0 0 14px" }}>{error}</p>}
        <button type="submit" disabled={loading || !password || !email} style={{
          width: "100%", background: PAL.ink, color: PAL.paper, border: 0, borderRadius: 10,
          padding: "12px 0", fontFamily: sans, fontSize: 14, fontWeight: 600,
          cursor: loading || !password || !email ? "default" : "pointer", opacity: loading || !password || !email ? 0.6 : 1,
        }}>{loading ? "Connexion…" : "Se connecter"}</button>
      </form>
    </div>
  );
}

function ArticleForm({
  initial, token, onCancel, onSaved,
}: {
  initial: Article | null; token: string; onCancel: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState(initial ? {
    category: initial.category, published: initial.published, featured: initial.featured,
    image_url: initial.image_url ?? "", published_at: initial.published_at,
    read_time_minutes: initial.read_time_minutes,
    title_fr: initial.title_fr, excerpt_fr: initial.excerpt_fr,
    title_en: initial.title_en ?? "", excerpt_en: initial.excerpt_en ?? "",
    title_ar: initial.title_ar ?? "", excerpt_ar: initial.excerpt_ar ?? "",
  } : EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/news/admin/upload-image`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set("image_url", data.url);
    } catch {
      setError("Échec de l'envoi de l'image.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const url = initial ? `${API}/api/news/admin/${initial.id}` : `${API}/api/news/admin`;
      const method = initial ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      onSaved();
    } catch {
      setError("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  const langBlock = (lang: "fr" | "en" | "ar", label: string, required: boolean) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, color: PAL.primary, marginBottom: 8, letterSpacing: ".08em" }}>{label}{required ? "" : " (optionnel)"}</div>
      <label style={labelStyle()}>Titre</label>
      <input value={(form as any)[`title_${lang}`]} onChange={e => set(`title_${lang}` as any, e.target.value)} required={required} style={inputStyle({ marginBottom: 10 })} />
      <label style={labelStyle()}>Extrait</label>
      <textarea value={(form as any)[`excerpt_${lang}`]} onChange={e => set(`excerpt_${lang}` as any, e.target.value)} required={required} rows={3} style={inputStyle({ resize: "vertical" as const })} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "oklch(20% 0.02 175 / .5)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px", zIndex: 100 }}>
      <form onSubmit={handleSubmit} style={{ background: PAL.paper, borderRadius: 20, padding: 32, width: "100%", maxWidth: 640, marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 500, color: PAL.ink, margin: 0 }}>{initial ? "Modifier l'article" : "Nouvel article"}</h2>
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: 0, cursor: "pointer", color: PAL.muted }}><X size={20} /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle()}>Catégorie</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle()}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle()}>Date de publication</label>
            <input type="date" value={form.published_at} onChange={e => set("published_at", e.target.value)} style={inputStyle()} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle()}>Temps de lecture (min)</label>
            <input type="number" min={1} value={form.read_time_minutes} onChange={e => set("read_time_minutes", Number(e.target.value))} style={inputStyle()} />
          </div>
          <div>
            <label style={labelStyle()}>Image de couverture</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ fontFamily: sans, fontSize: 12 }} />
            {uploading && <span style={{ fontFamily: sans, fontSize: 11, color: PAL.muted }}>Envoi…</span>}
            {form.image_url && <img src={form.image_url} alt="" style={{ marginTop: 8, width: "100%", height: 70, objectFit: "cover", borderRadius: 8 }} />}
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13, color: PAL.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} /> Publié
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: sans, fontSize: 13, color: PAL.ink, cursor: "pointer" }}>
            <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} /> Mise en avant (page d'accueil)
          </label>
        </div>

        {langBlock("fr", "Français", true)}
        {langBlock("en", "English", false)}
        {langBlock("ar", "العربية", false)}

        {error && <p style={{ fontFamily: sans, fontSize: 12, color: PAL.red, margin: "0 0 12px" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${PAL.line}`, borderRadius: 10, padding: "10px 20px", fontFamily: sans, fontSize: 13, fontWeight: 600, color: PAL.ink, cursor: "pointer" }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ background: PAL.ink, color: PAL.paper, border: 0, borderRadius: 10, padding: "10px 24px", fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}>{saving ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/news/admin`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { onLogout(); return; }
      const data = await res.json();
      setArticles(data.articles || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet article définitivement ?")) return;
    await fetch(`${API}/api/news/admin/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    load();
  }

  return (
    <div style={{ minHeight: "100vh", background: PAL.cream, padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: PAL.primary, letterSpacing: ".14em", textTransform: "uppercase" as const, fontWeight: 600 }}>§ Admin</div>
            <h1 style={{ fontFamily: serif, fontWeight: 500, fontSize: 34, color: PAL.ink, margin: "6px 0 0" }}>Gestion des actualités</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { setEditing(null); setFormOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: PAL.ink, color: PAL.paper, border: 0, borderRadius: 999, padding: "10px 18px", fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={15} /> Nouvel article
            </button>
            <button onClick={onLogout} title="Se déconnecter" style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${PAL.line}`, borderRadius: 999, padding: "10px 14px", fontFamily: sans, fontSize: 13, color: PAL.muted, cursor: "pointer" }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ fontFamily: sans, fontSize: 14, color: PAL.muted }}>Chargement…</p>
        ) : articles.length === 0 ? (
          <p style={{ fontFamily: sans, fontSize: 14, color: PAL.muted }}>Aucun article pour le moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {articles.map(a => (
              <div key={a.id} style={{ background: PAL.paper, border: `1px solid ${PAL.line}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                {a.image_url
                  ? <img src={a.image_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 10, background: PAL.cream, flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" as const }}>
                    <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: PAL.primary, background: PAL.primary + "15", borderRadius: 999, padding: "2px 9px", textTransform: "uppercase" as const }}>{a.category}</span>
                    {a.featured && <Star size={13} color="oklch(70% 0.13 80)" fill="oklch(70% 0.13 80)" />}
                    {a.published ? <Eye size={13} color={PAL.green} /> : <EyeOff size={13} color={PAL.muted} />}
                    <span style={{ fontFamily: mono, fontSize: 11, color: PAL.muted }}>{a.published_at}</span>
                  </div>
                  <div style={{ fontFamily: sans, fontSize: 14, fontWeight: 600, color: PAL.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title_fr}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setEditing(a); setFormOpen(true); }} style={{ background: "transparent", border: `1px solid ${PAL.line}`, borderRadius: 8, padding: 8, cursor: "pointer", color: PAL.ink }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(a.id)} style={{ background: "transparent", border: `1px solid ${PAL.line}`, borderRadius: 8, padding: 8, cursor: "pointer", color: PAL.red }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <ArticleForm
          initial={editing}
          token={token}
          onCancel={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function AdminNewsPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  if (!token) return <LoginForm onSuccess={setToken} />;
  return <AdminPanel token={token} onLogout={handleLogout} />;
}
