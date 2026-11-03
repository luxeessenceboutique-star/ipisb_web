import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Hospital, GraduationCap, Monitor, Building2, Microscope, Star, Newspaper, MailCheck, type LucideIcon } from "lucide-react";
import { NdLayout, PageHero, Arrow } from "@/components/nd/NdLayout";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:9000";

interface ApiArticle {
  id: string; category: string; image_url: string | null;
  published_at: string; read_time_minutes: number; title: string; excerpt: string;
}

export const Route = createFileRoute("/actualites")({
  component: ActualitesPage,
});

const ART_ICONS: LucideIcon[] = [Hospital, GraduationCap, Monitor, Building2, Microscope, Star];
const ART_CATS   = ["recherche", "vie", "plateforme", "evenement", "recherche", "vie"];
const CAT_ICON: Record<string, LucideIcon> = { recherche: Hospital, vie: GraduationCap, plateforme: Monitor, evenement: Building2 };

function ActualitesPage() {
  const { t, lang } = useI18n();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [apiArticles, setApiArticles] = useState<ApiArticle[] | null>(null);

  useEffect(() => {
    fetch(`${API}/api/news?lang=${lang}&limit=50`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.articles?.length) setApiArticles(data.articles); })
      .catch(() => { /* keep static fallback content */ });
  }, [lang]);

  const categories = [
    { id: "all",        label: t("act.cat.all") },
    { id: "recherche",  label: t("act.cat.recherche") },
    { id: "vie",        label: t("act.cat.vie") },
    { id: "plateforme", label: t("act.cat.plateforme") },
    { id: "evenement",  label: t("act.cat.evenement") },
  ];

  const articles = apiArticles
    ? apiArticles.map((a) => ({
        id: a.id, cat: a.category,
        tag: categories.find(c => c.id === a.category)?.label ?? a.category,
        date: a.published_at, time: `${a.read_time_minutes} min`,
        title: a.title, excerpt: a.excerpt, image: a.image_url,
        Icon: CAT_ICON[a.category] ?? GraduationCap,
      }))
    : [0, 1, 2, 3, 4, 5].map((i) => ({
        id: `a${i}`, cat: ART_CATS[i], tag: t(`act.a${i}.tag`), date: t(`act.a${i}.date`),
        time: t(`act.a${i}.time`), title: t(`act.a${i}.t`), excerpt: t(`act.a${i}.excerpt`),
        Icon: ART_ICONS[i], image: null as string | null,
      }));

  const q = searchQuery.toLowerCase();
  const filteredArticles = articles.filter((art) =>
    (activeCategory === "all" || art.cat === activeCategory) &&
    (art.title.toLowerCase().includes(q) || art.excerpt.toLowerCase().includes(q)));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError(t("act.nl.error")); return; }
    const p = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!p.test(email)) { setEmailError(t("act.nl.error.invalid")); return; }
    setEmailError(""); setEmailSuccess(true);
  };

  return (
    <NdLayout deps={[activeCategory, searchQuery, apiArticles]}>
      <PageHero eyebrow={t("act.eyebrow")} a={t("act.h1a")} b={t("act.h1b")} body={t("act.body")} img="/images/infra-anatomy.jpg" />

      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="fbar rv" style={{ marginBottom: 34 }}>
            <div className="fchips">
              {categories.map((cat) => (
                <button key={cat.id} className={`fchip${activeCategory === cat.id ? " on" : ""}`} onClick={() => setActiveCategory(cat.id)}>{cat.label}</button>
              ))}
            </div>
            <label className="fsearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" placeholder={t("act.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="grid3">
              {filteredArticles.map((art, i) => (
                <article key={art.id} className={`gcard acard tilt rv rv-d${i % 3}`}>
                  <div className="gimg" data-view>
                    {art.image ? <img src={art.image} alt={art.title} loading="lazy" /> : <art.Icon size={54} strokeWidth={1.3} />}
                    <span className="tag tagpos">{art.tag}</span>
                  </div>
                  <div className="gbody">
                    <div className="meta"><span>{art.date}</span><span className="dot" /><span>{art.time}</span></div>
                    <h3>{art.title}</h3>
                    <p>{art.excerpt}</p>
                    <div className="gfoot"><button className="ulink">{t("act.read")}</button></div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Newspaper size={44} strokeWidth={1.3} style={{ display: "inline-block" }} />
              <h3>{t("act.empty.title")}</h3>
              <p>{t("act.empty.body")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="nl rv">
            {!emailSuccess ? (
              <>
                <h3>{t("act.nl.h3a")} <em>{t("act.nl.h3b")}</em></h3>
                <p>{t("act.nl.body")}</p>
                <form onSubmit={handleSubscribe}>
                  <input type="text" placeholder={t("act.nl.placeholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
                  <button type="submit" className="btn btn-p sm">{t("act.nl.subscribe")}<span className="arr"><Arrow /></span></button>
                </form>
                {emailError && <p className="msg-err">{emailError}</p>}
              </>
            ) : (
              <div className="success" style={{ padding: 0 }}>
                <div className="sic"><MailCheck size={36} strokeWidth={1.6} /></div>
                <h3 style={{ fontSize: 28 }}>{t("act.nl.success.title")}</h3>
                <p>{t("act.nl.success.body")} <strong>{email}</strong>.</p>
                <button className="btn btn-g sm" onClick={() => { setEmail(""); setEmailSuccess(false); }}>{t("act.nl.reset")}</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </NdLayout>
  );
}
