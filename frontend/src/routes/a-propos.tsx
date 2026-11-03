import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Award, Heart, Lightbulb, Rocket, Hospital, Dna, Laptop, type LucideIcon } from "lucide-react";
import { NdLayout, PageHero, SecHead, NdCta, clean } from "@/components/nd/NdLayout";

export const Route = createFileRoute("/a-propos")({
  component: AProposPage,
});

const VAL_ICONS: LucideIcon[]   = [Award, Heart, Lightbulb, Rocket];
const INFRA_ICONS: LucideIcon[] = [Hospital, Dna, Laptop];
const INFRA_IMAGES = ["/images/infra-simulation.jpg", "/images/infra-anatomy.jpg", "/images/infra-multimedia.jpg"];
// Mêmes chiffres que l'ancienne section « À propos » (abt.stat1 / abt.stat3)
const TILES = [["2024", "abt.stat1"], ["94 %", "abt.stat3"]] as const;
const TIMELINE_YEARS = ["2024", "2024", "2025"];

function AProposPage() {
  const { t } = useI18n();
  const values = [0, 1, 2, 3].map((i) => ({ t: t(`ap.val.${i}.t`), d: t(`ap.val.${i}.d`), Icon: VAL_ICONS[i] }));
  const infras = [0, 1, 2].map((i) => ({ t: t(`ap.infra.${i}.t`), d: t(`ap.infra.${i}.d`), Icon: INFRA_ICONS[i], img: INFRA_IMAGES[i] }));
  const listItems = [t("abt.li2"), t("abt.li3"), t("abt.li4")];
  const timeline = TIMELINE_YEARS.map((year, i) => ({ year, label: t(`abt.tl${i + 1}`) }));

  return (
    <NdLayout>
      <PageHero eyebrow={t("abt.eyebrow")} a={t("abt.h2a")} b={t("abt.h2b")} body={t("abt.body")} img="/images/team-faculty.jpg" />

      {/* Intro + chiffres */}
      <section className="sec tight">
        <div className="wrap split">
          <div>
            <div className="stats">
              {TILES.map(([v, k], i) => (
                <div key={k} className={`stat ${i ? "mint" : "dark"} rv rv-d${i}`}><b>{v}</b><span>{t(k)}</span></div>
              ))}
            </div>
          </div>
          <ul className="flist" style={{ marginTop: 0 }}>
            {listItems.map((item, i) => <li key={i} className={`rv rv-d${i}`}><i>0{i + 1}</i>{item}</li>)}
          </ul>
        </div>
        <div className="wrap">
          <div className="tline rv" style={{ ["--n" as string]: timeline.length }}>
            {timeline.map((ev, i) => <div key={i} className="tl"><b>{ev.year}</b><p>{ev.label}</p></div>)}
          </div>
        </div>
      </section>

      {/* Histoire */}
      <section className="sec tight alt">
        <div className="wrap">
          <SecHead center eyebrow={t("ap.history.eyebrow")} a={t("ap.history.h2a")} b={t("ap.history.h2b")} body={t("ap.history.body")} />
        </div>
      </section>

      {/* Valeurs */}
      <section className="sec">
        <div className="wrap">
          <SecHead eyebrow={t("ap.val.eyebrow")} a={t("ap.val.h2a")} b={t("ap.val.h2b")} />
          <div className="grid4">
            {values.map((v, i) => (
              <div key={i} className={`val tilt rv rv-d${i}`}>
                <div className="vi"><v.Icon size={24} strokeWidth={1.8} /></div>
                <h3>{v.t}</h3><p>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="sec tight">
        <div className="wrap">
          <div className="team-wrap rv">
            <img src="/images/team-faculty.jpg" alt={t("ap.team.h2a")} />
            <div className="team-cap">
              <div><span className="eyebrow">{clean(t("ap.team.eyebrow"))}</span><h2>{t("ap.team.h2a")} <em>{t("ap.team.h2b")}</em></h2></div>
              <div className="quote"><b style={{ display: "block", fontSize: 17, marginBottom: 12 }}>{t("ap.team.stats")}</b>
                {[["40+", t("ap.team.l1")], ["85%", t("ap.team.l2")], ["100%", t("ap.team.l3")]].map(([n, l]) => (
                  <div key={l} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "8px 0", borderTop: "1px solid rgba(255,255,255,.18)" }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "var(--mint)", minWidth: 64 }}>{n}</span><span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="rv" style={{ maxWidth: 760, margin: "34px auto 0", textAlign: "center", color: "var(--ink-2)", fontSize: 17 }}>{t("ap.team.body")}</p>
        </div>
      </section>

      {/* Infrastructures */}
      <section className="sec">
        <div className="wrap">
          <SecHead eyebrow={t("ap.infra.eyebrow")} a={t("ap.infra.h2a")} b={t("ap.infra.h2b")} />
          <div className="grid3">
            {infras.map((infra, i) => (
              <div key={i} className={`gcard tilt rv rv-d${i}`}>
                <div className="gimg" data-view><img src={infra.img} alt={infra.t} loading="lazy" /></div>
                <div className="gbody">
                  <div className="ic"><infra.Icon size={20} strokeWidth={1.8} /></div>
                  <h3>{infra.t}</h3><p>{infra.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NdCta />
    </NdLayout>
  );
}
