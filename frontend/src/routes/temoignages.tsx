import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { NdLayout, PageHero, Field, Arrow, clean } from "@/components/nd/NdLayout";

export const Route = createFileRoute("/temoignages")({
  component: TemoignagesPage,
});

const TESTI_NAMES    = ["Yassine B.", "Dr. L. Bensalah", "Inès M.", "Prof. K. Alami", "Salma R.", "Dr. Karim Tazi"];
const TESTI_INITIALS = ["YB", "LB", "IM", "KA", "SR", "KT"];

function TemoignagesPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: "", role: "", program: "", rating: "5", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const testimonials = [0, 1, 2, 3, 4, 5].map((i) => ({
    q: t(`tem.t${i}.q`), r: t(`tem.t${i}.r`), n: TESTI_NAMES[i], initials: TESTI_INITIALS[i], stars: 5,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("tem.form.err.name");
    if (!formData.message.trim()) newErrors.message = t("tem.form.err.msg");
    else if (formData.message.trim().length < 10) newErrors.message = t("tem.form.err.short");
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({}); setSubmitted(true);
  };

  return (
    <NdLayout deps={[submitted]}>
      <PageHero eyebrow={t("tem.eyebrow")} a={t("tem.h1a")} b={t("tem.h1b")} body={t("tem.body")} img="/images/program-auxiliaire.jpg">
        <div className="stats" style={{ marginTop: 34, maxWidth: 640 }}>
          {[["96 %", t("tem.stat1")], ["98 %", t("tem.stat2")], ["40 +", t("tem.stat3")]].map(([n, l], i) => (
            <div key={i} className={`stat${i === 0 ? " dark" : i === 1 ? " mint" : ""}`}><b>{n}</b><span>{l}</span></div>
          ))}
        </div>
      </PageHero>

      <section className="sec tight">
        <div className="wrap">
          <div className="grid3">
            {testimonials.map((x, i) => (
              <article key={i} className={`tcard tilt rv rv-d${i % 3}${i === 1 || i === 3 ? " feat" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="q">“</span><span className="stars">{"★".repeat(x.stars)}</span>
                </div>
                <blockquote>{x.q}</blockquote>
                <div className="who"><span className="ini">{x.initials}</span><div><b>{x.n}</b><small>{x.r}</small></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 20 }}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div className="formcard rv">
            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div style={{ textAlign: "center" }}>
                  <span className="eyebrow">{clean(t("tem.form.eyebrow"))}</span>
                  <h3>{t("tem.form.h3")}</h3>
                  <p className="sub">{t("tem.form.body")}</p>
                </div>
                <div className="fgrid">
                  <Field label={t("tem.form.name")} error={errors.name}>
                    <input type="text" placeholder={t("tem.form.name.ph")} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </Field>
                  <div className="two">
                    <Field label={t("tem.form.role")}>
                      <select value={formData.role || t("tem.form.r.student")} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                        <option>{t("tem.form.r.student")}</option>
                        <option>{t("tem.form.r.graduate")}</option>
                        <option>{t("tem.form.r.teacher")}</option>
                        <option>{t("tem.form.r.partner")}</option>
                      </select>
                    </Field>
                    <Field label={t("tem.form.rating")}>
                      <select value={formData.rating} onChange={(e) => setFormData({ ...formData, rating: e.target.value })}>
                        <option value="5">{t("tem.form.rt5")}</option>
                        <option value="4">{t("tem.form.rt4")}</option>
                        <option value="3">{t("tem.form.rt3")}</option>
                        <option value="2">{t("tem.form.rt2")}</option>
                      </select>
                    </Field>
                  </div>
                  <Field label={t("tem.form.program")}>
                    <input type="text" placeholder={t("tem.form.program.ph")} value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} />
                  </Field>
                  <Field label={t("tem.form.message")} error={errors.message}>
                    <textarea placeholder={t("tem.form.message.ph")} rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                  </Field>
                  <button type="submit" className="btn btn-p fsubmit">{t("tem.form.submit")}<span className="arr"><Arrow /></span></button>
                </div>
              </form>
            ) : (
              <div className="success">
                <div className="sic"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M5 12l5 5 9-10" /></svg></div>
                <h3>{t("tem.form.success.title")}</h3>
                <p>{t("tem.form.success.body")}</p>
                <button className="btn btn-g sm" onClick={() => { setFormData({ name: "", role: "", program: "", rating: "5", message: "" }); setSubmitted(false); }}>{t("tem.form.reset")}</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </NdLayout>
  );
}
