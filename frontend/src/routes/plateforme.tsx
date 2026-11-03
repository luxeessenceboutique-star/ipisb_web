import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { NdLayout, PageHero, SecHead, NdCta, Arrow, Bubble, openAya, clean } from "@/components/nd/NdLayout";

export const Route = createFileRoute("/plateforme")({
  component: PlatformePage,
});

const MOD_IDS = ["01", "02", "03", "04", "05", "06", "07", "08"];

function PlatformePage() {
  const { t } = useI18n();
  const studentFeatures = [t("pp.stu.f1"), t("pp.stu.f2"), t("pp.stu.f3"), t("pp.stu.f4"), t("pp.stu.f5")];
  const teacherFeatures = [t("pp.tea.f1"), t("pp.tea.f2"), t("pp.tea.f3"), t("pp.tea.f4"), t("pp.tea.f5")];

  return (
    <NdLayout>
      <PageHero eyebrow={t("pp.eyebrow")} a={t("pp.h1a")} b={t("pp.h1b")} body={t("pp.body")} img="/images/infra-multimedia.jpg" />

      {/* Étudiants */}
      <section className="sec tight">
        <div className="wrap split">
          <div className="simg rv" data-view><img src="/images/program-aide-soignant.jpg" alt="" loading="lazy" /></div>
          <div>
            <span className="eyebrow rv">{clean(t("pp.stu.eyebrow"))}</span>
            <h2 className="rv rv-d1">{t("pp.stu.h3")}</h2>
            <ul className="flist">{studentFeatures.map((f, i) => <li key={i} className={`rv rv-d${i % 3}`}><i>0{i + 1}</i>{f}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* Enseignants */}
      <section className="sec tight alt">
        <div className="wrap split rev">
          <div className="simg rv" data-view><img src="/images/team-faculty.jpg" alt="" loading="lazy" /></div>
          <div>
            <span className="eyebrow rv">{clean(t("pp.tea.eyebrow"))}</span>
            <h2 className="rv rv-d1">{t("pp.tea.h3")}</h2>
            <ul className="flist">{teacherFeatures.map((f, i) => <li key={i} className={`rv rv-d${i % 3}`}><i>0{i + 1}</i>{f}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="sec">
        <div className="wrap">
          <SecHead eyebrow={t("pp.mod.eyebrow")} a={t("pp.mod.h2a")} b={t("pp.mod.h2b")} />
          <div className="grid4">
            {MOD_IDS.map((n, i) => (
              <div key={n} className={`mod rv rv-d${i % 4}`}>
                <span className="mi">/{n}</span>
                <h4>{t(`pp.mod.${n}`)}</h4>
                <p>{t(`pp.mod.${n}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NdCta>
        <Link to="/contact" className="btn btn-p magnet">{clean(t("cta.advisor"))}<span className="arr"><Arrow /></span></Link>
        <button className="btn btn-g magnet" onClick={openAya}>Aya<span className="arr"><Bubble /></span></button>
      </NdCta>
    </NdLayout>
  );
}
