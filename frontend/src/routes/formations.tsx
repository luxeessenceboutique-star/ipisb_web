import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { NdLayout, PageHero, SecHead, NdCta, Arrow, clean } from "@/components/nd/NdLayout";

export const Route = createFileRoute("/formations")({
  component: FormationsPage,
});

const PROG_IDS    = ["polyvalent", "auxiliaire", "aide-soignant"];
const PROG_CATS   = ["licence-soins", "licence-soins", "soins"];
const PROG_IMAGES = ["/images/program-polyvalent.jpg", "/images/program-auxiliaire.jpg", "/images/program-aide-soignant.jpg"];

function FormationsPage() {
  const { t } = useI18n();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    { id: "all",     label: t("fp.cat.all") },
    { id: "licence", label: t("fp.cat.licence") },
    { id: "soins",   label: t("fp.cat.soins") },
  ];

  const programs = [0, 1, 2].map((i) => ({
    id: PROG_IDS[i], cat: PROG_CATS[i],
    t: t(`fp.p${i}.t`), d: t(`fp.p${i}.d`), dur: t(`fp.p${i}.dur`),
    req: t(`fp.p${i}.req`), hours: t(`fp.p${i}.hours`), obj: t(`fp.p${i}.obj`),
    careers: [t(`fp.p${i}.c1`), t(`fp.p${i}.c2`), t(`fp.p${i}.c3`), t(`fp.p${i}.c4`)],
    img: PROG_IMAGES[i],
  }));

  const comparisons = [0, 1, 2].map((i) => ({ t: t(`fp.p${i}.t`), def: t(`fp.p${i}.def`), who: t(`fp.p${i}.who`) }));

  const q = searchQuery.toLowerCase();
  const filteredPrograms = programs.filter((p) => {
    let matchFilter = true;
    if (activeFilter === "licence") matchFilter = p.cat.includes("licence");
    else if (activeFilter === "soins") matchFilter = p.cat.includes("soins");
    return matchFilter && (p.t.toLowerCase().includes(q) || p.d.toLowerCase().includes(q));
  });

  return (
    <NdLayout deps={[activeFilter, searchQuery, expandedId]}>
      <PageHero eyebrow={t("fp.eyebrow")} a={t("fp.h1a")} b={t("fp.h1b")} body={t("fp.body")} img="/images/program-polyvalent.jpg" />

      {/* Comprendre les métiers */}
      <section className="sec tight">
        <div className="wrap">
          <div className="panel-soft">
            <SecHead eyebrow={t("fp.compare.eyebrow")} a={t("fp.compare.h2a")} b={t("fp.compare.h2b")} body={t("fp.compare.body")} />
            <div className="grid3">
              {comparisons.map((c, i) => (
                <div key={i} className={`ccard tilt rv rv-d${i}`}>
                  <span className="cn">/0{i + 1}</span>
                  <h3>{c.t}</h3>
                  <p>{c.def}</p>
                  <p className="who">{c.who}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filtres + programmes */}
      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap">
          <div className="fbar rv" style={{ marginBottom: 34 }}>
            <div className="fchips">
              {categories.map((cat) => (
                <button key={cat.id} className={`fchip${activeFilter === cat.id ? " on" : ""}`} onClick={() => setActiveFilter(cat.id)}>{cat.label}</button>
              ))}
            </div>
            <label className="fsearch">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <input type="text" placeholder={t("fp.search")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </label>
          </div>

          {filteredPrograms.length > 0 ? (
            <div className="grid3">
              {filteredPrograms.map((p, i) => {
                const isExpanded = expandedId === p.id;
                return (
                  <article key={p.id} className={`gcard rv rv-d${i}`}>
                    <div className="gimg" data-view><img src={p.img} alt={p.t} loading="lazy" /></div>
                    <div className="gbody">
                      <div className="meta"><span className="tag">{p.dur}</span><span className="dot" />{t("fp.stages")} {p.hours}</div>
                      <h3>{p.t}</h3>
                      <p>{p.d}</p>
                      <div className={`expand${isExpanded ? " open" : ""}`}>
                        <div>
                          <h4>{t("fp.objectives")}</h4><p>{p.obj}</p>
                          <h4>{t("fp.admission")}</h4><p>{p.req}</p>
                          <h4>{t("fp.careers")}</h4>
                          <ul className="clist2">{p.careers.map((c, k) => <li key={k}>{c}</li>)}</ul>
                        </div>
                      </div>
                      <div className="gfoot">
                        <button className="ulink" onClick={() => setExpandedId(isExpanded ? null : p.id)}>{isExpanded ? t("fp.collapse") : t("fp.details")}</button>
                        <Link to="/contact" className="btn btn-p sm">{clean(t("fp.apply"))}<span className="arr"><Arrow /></span></Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
              <h3>{t("fp.empty.title")}</h3>
              <p>{t("fp.empty.body")}</p>
            </div>
          )}
        </div>
      </section>

      <NdCta h2a={t("fp.cta.h2a")} h2b={t("fp.cta.h2b")} body={t("fp.cta.body")}>
        <Link to="/contact" className="btn btn-p magnet">{clean(t("fp.cta.contact"))}<span className="arr"><Arrow /></span></Link>
        <a href="tel:+212632822898" className="btn btn-g magnet">{clean(t("fp.cta.call"))}<span className="arr"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg></span></a>
      </NdCta>
    </NdLayout>
  );
}
