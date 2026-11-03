import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";
import { ND } from "./texts";
import "./nd.css";

/* ───────── shared bits ───────── */
export const openAya = () => window.dispatchEvent(new CustomEvent("aya:open"));
export const clean = (s: string) => s.replace(/^§\s*/, "").replace(/\s*[→←]\s*/g, " ").trim();

export const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6h10M7 2l4 4-4 4" /></svg>
);
export const Bubble = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H7l-3 3z" /></svg>
);
export const Cross = ({ s = 30 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" /></svg>
);

const LANGS: { code: Lang; label: string }[] = [{ code: "fr", label: "FR" }, { code: "en", label: "EN" }, { code: "ar", label: "ع" }];
export const NAV = [
  { to: "/formations", k: "nav.formations" }, { to: "/plateforme", k: "nav.plateforme" },
  { to: "/a-propos", k: "nav.a-propos" }, { to: "/actualites", k: "nav.actualites" }, { to: "/contact", k: "nav.contact" },
] as const;

/* ───────── nav ───────── */
export function NdNav() {
  const { lang, setLang, t } = useI18n();
  const [menu, setMenu] = useState(false);
  const path = useRouterState().location.pathname;
  useEffect(() => { setMenu(false); }, [path]);
  const langIdx = LANGS.findIndex(l => l.code === lang);
  return (
    <>
      <nav className="nav">
        <Link to="/" className="brand"><img src="/ipisb-logo.png" alt="" /><div>IPISB<small>CONNECT</small></div></Link>
        <div className="links">{NAV.map(n => <Link key={n.to} to={n.to} className={path === n.to ? "on" : ""}>{t(n.k)}</Link>)}</div>
        <div className="nav-r">
          <div className="lang"><span className="pill" style={{ transform: `translateX(${langIdx * 100}%)` }} />
            {LANGS.map(l => <button key={l.code} className={lang === l.code ? "on" : ""} onClick={() => setLang(l.code)}>{l.label}</button>)}
          </div>
          <Link to="/contact" className="btn btn-p">{t("nav.signup")}<span className="arr"><Arrow /></span></Link>
          <button className="burger" aria-label="Menu" onClick={() => setMenu(m => !m)}>
            <span style={{ transform: menu ? "translateY(3px) rotate(45deg)" : "" }} /><span style={{ transform: menu ? "translateY(-3px) rotate(-45deg)" : "" }} />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu${menu ? " open" : ""}`}>
        <Link to="/" onClick={() => setMenu(false)}>{t("nav.home")}</Link>
        {NAV.map(n => <Link key={n.to} to={n.to} onClick={() => setMenu(false)}>{t(n.k)}</Link>)}
      </div>
    </>
  );
}

/* ───────── footer ───────── */
export function NdFooter() {
  const { lang, t } = useI18n();
  const T = ND[lang];
  return (
    <footer>
      <div className="wrap">
        <div className="foot">
          <div><img className="logo-full" src="/ipisb-logo-full.png" alt="IPISB" /><p style={{ color: "var(--mute)", fontSize: 14.5, maxWidth: 300 }}>{T.footDesc}</p></div>
          <div><h5>{T.nav}</h5>{NAV.map(n => <Link key={n.to} to={n.to}>{t(n.k)}</Link>)}<Link to="/temoignages">{clean(t("tem.eyebrow"))}</Link></div>
          <div><h5>{t("footer.col2")}</h5>{[0, 1, 2].map(i => <Link key={i} to="/formations">{t(`prog.${i}.t`)}</Link>)}</div>
          <div><h5>{T.contact}</h5><ul><li>El Jadida, Maroc</li><li><a href="tel:+212632822898" dir="ltr">+212 632-822898</a></li><li><a href="mailto:contact@ipisb.ma">contact@ipisb.ma</a></li><li>{T.hours}</li></ul></div>
        </div>
        <div className="giant">{"IPISB".split("").map((c, i) => <span key={i}>{c}</span>)}</div>
        <div className="foot-b"><span>© {new Date().getFullYear()} IPISB Connect — {t("footer.copy")}</span><span>{T.madeBy}</span></div>
      </div>
    </footer>
  );
}

/* ───────── page effects: cursor, progress, nav, reveal, tilt, magnet ───────── */
export function useNdEffects(root: React.RefObject<HTMLDivElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    const $$ = (s: string) => Array.from(el.querySelectorAll(s)) as HTMLElement[];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hover = matchMedia("(hover:hover)").matches;
    const offs: (() => void)[] = [];
    const on = (tg: EventTarget, ev: string, fn: (e: Event) => void, o?: AddEventListenerOptions) => { tg.addEventListener(ev, fn, o); offs.push(() => tg.removeEventListener(ev, fn)); };

    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
    $$(".rv:not(.in),.steps,.heart,.giant").forEach(n => io.observe(n));
    offs.push(() => io.disconnect());

    if (!reduce && hover) {
      $$(".tilt").forEach(n => {
        on(n, "mousemove", e => {
          const m = e as MouseEvent, r = n.getBoundingClientRect(), x = (m.clientX - r.left) / r.width, y = (m.clientY - r.top) / r.height;
          n.style.setProperty("--mx", x * 100 + "%"); n.style.setProperty("--my", y * 100 + "%");
          n.style.transform = `perspective(1000px) rotateY(${(x - .5) * 7}deg) rotateX(${(.5 - y) * 7}deg) translateY(-6px)`;
        });
        on(n, "mouseleave", () => { n.style.transform = ""; });
      });
      $$(".magnet").forEach(n => {
        on(n, "mousemove", e => { const m = e as MouseEvent, r = n.getBoundingClientRect(); n.style.transform = `translate(${(m.clientX - r.left - r.width / 2) * .3}px,${(m.clientY - r.top - r.height / 2) * .4}px)`; });
        on(n, "mouseleave", () => { n.style.transform = ""; });
      });
    }
    return () => offs.forEach(f => f());
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function useChrome(root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current; if (!el) return;
    const cur = el.querySelector(".nd-cursor") as HTMLElement | null;
    const nav = el.querySelector(".nav") as HTMLElement, prog = el.querySelector(".progress") as HTMLElement;
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, raf = 0, lastY = 0;
    const move = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; cur?.classList.add("live"); };
    const over = (e: MouseEvent) => {
      const tg = e.target as HTMLElement; if (!cur || !tg.closest) return;
      const v = tg.closest("[data-view]"), l = tg.closest("a,button,[data-link],input,select,textarea");
      cur.classList.toggle("big", !!v); cur.classList.toggle("link", !v && !!l);
    };
    const loop = () => { cx += (mx - cx) * .18; cy += (my - cy) * .18; if (cur) cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; raf = requestAnimationFrame(loop); };
    const scroll = () => {
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("scrolled", y > 40);
      nav.classList.toggle("hide", y > lastY && y > 600 && !el.querySelector(".mobile-menu.open")); lastY = y;
      prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    };
    addEventListener("mousemove", move); document.addEventListener("mouseover", over); addEventListener("scroll", scroll, { passive: true });
    loop(); scroll();
    return () => { removeEventListener("mousemove", move); document.removeEventListener("mouseover", over); removeEventListener("scroll", scroll); cancelAnimationFrame(raf); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ───────── layout for inner pages ───────── */
export function NdLayout({ children, deps = [] }: { children: ReactNode; deps?: unknown[] }) {
  const { lang } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setReady(true)); window.scrollTo(0, 0); return () => cancelAnimationFrame(id); }, []);
  useChrome(root);
  useNdEffects(root, [lang, ...deps]);
  return (
    <div ref={root} className={`nd nd-page${ready ? " ready" : ""}`}>
      <div className="progress" />
      <div className="nd-cursor"><span>{ND[lang].view}</span></div>
      <NdNav />
      <main>{children}</main>
      <NdFooter />
    </div>
  );
}

/* ───────── page hero ───────── */
export function PageHero({ eyebrow, a, b, body, img, children }: { eyebrow: string; a: string; b: string; body: string; img?: string; children?: ReactNode }) {
  return (
    <header className={`phero${img ? " with-img" : ""}`}>
      <div className="blob" /><div className="blob b2" /><div className="dots-bg" />
      <div className="wrap phero-in">
        <div>
          <span className="eyebrow fade d1">{clean(eyebrow)}</span>
          <h1>
            <span className="line"><span>{a}</span></span>
            <span className="line"><span><em>{b}</em></span></span>
          </h1>
          <p className="lead fade d2">{body}</p>
          {children && <div className="fade d3">{children}</div>}
        </div>
        {img && (
          <div className="phero-vis fade d2">
            <div className="ring-o" /><div className="ring-o r2" />
            <div className="phero-img"><img src={img} alt="" /></div>
          </div>
        )}
      </div>
    </header>
  );
}

/* ───────── CTA band ───────── */
export function NdCta({ h2a, h2b, body, children }: { h2a?: string; h2b?: string; body?: string; children?: ReactNode }) {
  const { lang, t } = useI18n();
  const T = ND[lang];
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-box rv">
          <div className="blob" /><div className="blob b2" />
          <span className="cross" style={{ top: "12%", left: "8%" }}><Cross s={70} /></span>
          <span className="cross" style={{ bottom: "14%", right: "9%", animationDelay: "-4s" }}><Cross s={100} /></span>
          <span className="eyebrow">{T.ctaEye}</span>
          <div className="big-t sm">{h2a ?? t("cta.h2a")} <span className="serif">{h2b ?? t("cta.h2b")}</span></div>
          <p>{body ?? t("cta.body")}</p>
          <div className="hero-cta">
            {children ?? (<>
              <Link to="/contact" className="btn btn-p magnet">{T.ctaBtn}<span className="arr"><Arrow /></span></Link>
              <button className="btn btn-g magnet" onClick={openAya}>{T.ctaAsk}<span className="arr"><Bubble /></span></button>
            </>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── small UI ───────── */
export function SecHead({ eyebrow, a, b, body, center }: { eyebrow: string; a: string; b?: string; body?: string; center?: boolean }) {
  return (
    <div className={`sec-head${center ? " center" : ""}`}>
      <div><span className="eyebrow rv">{clean(eyebrow)}</span><h2 className="rv rv-d1">{a} {b && <em>{b}</em>}</h2></div>
      {body && <p className="rv rv-d2">{body}</p>}
    </div>
  );
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className={`fld${error ? " err" : ""}`}>
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
