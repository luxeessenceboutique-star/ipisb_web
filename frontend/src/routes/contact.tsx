import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Phone, Smartphone, Mail, MapPin, Clock, MailCheck, type LucideIcon } from "lucide-react";
import { NdLayout, PageHero, SecHead, Field, Arrow, Bubble, openAya, clean } from "@/components/nd/NdLayout";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", program: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const faqs = [0, 1, 2].map((i) => ({ q: t(`con.faq.q${i}`), a: t(`con.faq.a${i}`) }));
  const contactInfo: { label: string; val: string; sub: string; Icon: LucideIcon; href?: string }[] = [
    { label: t("con.info.p1.label"),     val: "+212 632-822898",        sub: t("con.info.p1.sub"),     Icon: Phone,      href: "tel:+212632822898" },
    { label: t("con.info.p2.label"),     val: "+212 6 0713-1585",       sub: t("con.info.p2.sub"),     Icon: Smartphone, href: "tel:+212607131585" },
    { label: t("con.info.email.label"),  val: "contact@ipisb.ma",       sub: t("con.info.email.sub"),  Icon: Mail,       href: "mailto:contact@ipisb.ma" },
    { label: t("con.info.campus.label"), val: t("con.info.campus.val"), sub: t("con.info.campus.sub"), Icon: MapPin },
    { label: t("con.info.hours.label"),  val: t("con.info.hours.val"),  sub: t("con.info.hours.sub"),  Icon: Clock },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t("con.form.err.name");
    if (!formData.email.trim()) { newErrors.email = t("con.form.err.email"); }
    else { const r = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; if (!r.test(formData.email)) newErrors.email = t("con.form.err.email.invalid"); }
    if (!formData.phone.trim()) { newErrors.phone = t("con.form.err.phone"); }
    else { const c = formData.phone.replace(/[\s-+()]/g, ""); if (c.length < 8 || isNaN(Number(c))) newErrors.phone = t("con.form.err.phone.invalid"); }
    if (!formData.program) newErrors.program = t("con.form.err.program");
    if (!formData.message.trim()) { newErrors.message = t("con.form.err.message"); }
    else if (formData.message.trim().length < 10) { newErrors.message = t("con.form.err.msg.short"); }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({}); setSubmitted(true);
  };

  const Info = ({ c }: { c: (typeof contactInfo)[number] }) => (
    <>
      <span className="ii"><c.Icon size={20} strokeWidth={1.8} /></span>
      <div><small>{c.label}</small><b dir={c.href?.startsWith("tel") ? "ltr" : undefined} style={{ textAlign: "start" }}>{c.val}</b><em>{c.sub}</em></div>
    </>
  );

  return (
    <NdLayout deps={[submitted]}>
      <PageHero eyebrow={t("con.eyebrow")} a={t("con.h1a")} b={t("con.h1b")} body={t("con.body")} img="/images/infra-simulation.jpg">
        <div className="hero-cta">
          <a href="tel:+212632822898" className="btn btn-p magnet" dir="ltr">+212 632-822898<span className="arr"><Arrow /></span></a>
          <button className="btn btn-g magnet" onClick={openAya}>Aya<span className="arr"><Bubble /></span></button>
        </div>
      </PageHero>

      <section className="sec tight">
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <h2 className="rv" style={{ marginTop: 0, marginBottom: 26, fontSize: "clamp(30px,3.4vw,46px)" }}>{t("con.info.title")}</h2>
            <div className="info">
              {contactInfo.map((c, i) => c.href
                ? <a key={i} href={c.href} className={`rv rv-d${i % 3}`}><Info c={c} /></a>
                : <div key={i} className={`rv rv-d${i % 3}`}><Info c={c} /></div>)}
            </div>
            <div className="mapcard rv">
              <span className="pin" />
              <h4>{t("con.map.title")}</h4>
              <p>{t("con.map.body")}</p>
              <a href="https://maps.google.com/?q=IPISB+El+Jadida" target="_blank" rel="noreferrer">{clean(t("con.map.cta"))} →</a>
            </div>
          </div>

          <div className="formcard rv rv-d1">
            {!submitted ? (
              <form onSubmit={handleFormSubmit}>
                <span className="eyebrow">{clean(t("con.form.eyebrow"))}</span>
                <h3>{t("con.form.h3")}</h3>
                <p className="sub">{t("con.form.body")}</p>
                <div className="fgrid">
                  <Field label={t("con.form.name")} error={errors.name}>
                    <input type="text" placeholder={t("con.form.name.ph")} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </Field>
                  <div className="two">
                    <Field label={t("con.form.email")} error={errors.email}>
                      <input type="text" placeholder="exemple@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </Field>
                    <Field label={t("con.form.phone")} error={errors.phone}>
                      <input type="text" placeholder={t("con.form.phone.ph")} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </Field>
                  </div>
                  <Field label={t("con.form.program")} error={errors.program}>
                    <select value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })}>
                      <option value="">{t("con.form.program.ph")}</option>
                      {[1, 2, 3, 4, 5, 6, 7].map(i => <option key={i}>{t(`con.form.opt${i}`)}</option>)}
                    </select>
                  </Field>
                  <Field label={t("con.form.message")} error={errors.message}>
                    <textarea placeholder={t("con.form.message.ph")} rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                  </Field>
                  <button type="submit" className="btn btn-p fsubmit">{t("con.form.submit")}<span className="arr"><Arrow /></span></button>
                </div>
              </form>
            ) : (
              <div className="success">
                <div className="sic"><MailCheck size={36} strokeWidth={1.6} /></div>
                <h3>{t("con.form.success.title")}</h3>
                <p>{t("con.form.success.body")}</p>
                <button className="btn btn-g sm" onClick={() => { setFormData({ name: "", email: "", phone: "", program: "", message: "" }); setSubmitted(false); }}>{t("con.form.reset")}</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="sec alt">
        <div className="wrap">
          <SecHead center eyebrow={t("con.faq.eyebrow")} a={t("con.faq.h2a")} b={t("con.faq.h2b")} />
          <div className="faq rv">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className={`fq${isOpen ? " open" : ""}`}>
                  <button onClick={() => setOpenFaqIdx(isOpen ? null : idx)} aria-expanded={isOpen}>{faq.q}<span className="pm" /></button>
                  <div className="ans"><div><p>{faq.a}</p></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </NdLayout>
  );
}
