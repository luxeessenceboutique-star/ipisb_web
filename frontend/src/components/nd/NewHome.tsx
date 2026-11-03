import { useEffect, useRef, useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n, type Lang } from "@/lib/i18n";
import { ND } from "./texts";
import "./nd.css";
import { NdNav, NdFooter } from "./NdLayout";

/* ───────── helpers ───────── */
export const openAya = () => window.dispatchEvent(new CustomEvent("aya:open"));

const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6h10M7 2l4 4-4 4" /></svg>
);
const Bubble = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H7l-3 3z" /></svg>
);
const Cross = ({ s = 30 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" /></svg>
);
const Cap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></svg>
);

function Counter({ to, pad = true }: { to: number; pad?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      let s = 0;
      const st = (ts: number) => { s = s || ts; const p = Math.min(1, (ts - s) / 1600); setV(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) raf = requestAnimationFrame(st); };
      raf = requestAnimationFrame(st);
    }, { threshold: .3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{pad ? String(v).padStart(2, "0") : v}</span>;
}

const LANGS: { code: Lang; label: string }[] = [{ code: "fr", label: "FR" }, { code: "en", label: "EN" }, { code: "ar", label: "ع" }];
const NAV = [
  { to: "/formations", k: "nav.formations" }, { to: "/plateforme", k: "nav.plateforme" },
  { to: "/a-propos", k: "nav.a-propos" }, { to: "/actualites", k: "nav.actualites" }, { to: "/contact", k: "nav.contact" },
] as const;
const PROG_IMG = ["/images/program-polyvalent.jpg", "/images/program-auxiliaire.jpg", "/images/program-aide-soignant.jpg"];
const PROG_CLS = ["", "pdark", "mintc"];
const ROOM_IMG = ["/images/infra-simulation.jpg", "/images/infra-anatomy.jpg", "/images/infra-multimedia.jpg"];

/* ───────── page ───────── */
export function NewHome() {
  const { lang, setLang, t } = useI18n();
  const T = ND[lang];
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [loaderGo, setLoaderGo] = useState(false);
  const [pct, setPct] = useState(0);
  const [rotI, setRotI] = useState(0);
  const [room, setRoom] = useState<number | null>(null);
  const [hsN, setHsN] = useState(1);

  /* loader (once per session) */
  useEffect(() => {
    const seen = sessionStorage.getItem("nd-loader");
    if (seen) { setPct(100); setLoaderGo(true); setReady(true); return; }
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(100, n + Math.ceil(Math.random() * 8)); setPct(n);
      if (n >= 100) {
        clearInterval(id);
        setTimeout(() => { setLoaderGo(true); sessionStorage.setItem("nd-loader", "1"); setTimeout(() => setReady(true), 550); }, 200);
      }
    }, 40);
    return () => clearInterval(id);
  }, []);

  /* rotating words */
  useEffect(() => { const id = setInterval(() => setRotI(i => (i + 1) % 3), 2600); return () => clearInterval(id); }, []);

  /* everything imperative: cursor, scroll engine, reveal, tilt, magnet, sphere */
  useEffect(() => {
    const el = root.current!; const $ = <E extends Element = HTMLElement>(s: string) => el.querySelector(s) as E | null;
    const $$ = <E extends Element = HTMLElement>(s: string) => Array.from(el.querySelectorAll(s)) as E[];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hover = matchMedia("(hover:hover)").matches;
    const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const offs: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(tg: Window | HTMLElement, ev: K, fn: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      tg.addEventListener(ev, fn as EventListener, o); offs.push(() => tg.removeEventListener(ev, fn as EventListener));
    };
    let raf = 0;

    /* cursor + preview follow */
    const cur = $(".nd-cursor")!, pv = $(".nd-preview")!;
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, tx = mx, ty = my;
    on(window, "mousemove", e => { mx = e.clientX; my = e.clientY; cur.classList.add("live"); });
    on(document as unknown as HTMLElement, "mouseover", (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      const v = tgt.closest?.("[data-view]"), l = tgt.closest?.("a,button,[data-link]");
      cur.classList.toggle("big", !!v); cur.classList.toggle("link", !v && !!l);
    });
    const loop = () => {
      cx += (mx - cx) * .18; cy += (my - cy) * .18; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      tx += (mx - tx) * .12; ty += (my - ty) * .12; pv.style.left = tx + "px"; pv.style.top = ty + "px";
      raf = requestAnimationFrame(loop);
    };
    loop();

    /* scroll engine */
    const nav = $(".nav")!, prog = $(".progress")!;
    const hs = $(".hscroll")!, track = $(".hs-track")!, hsBar = $(".hs-bar i")!;
    const zoom = $(".zoom")!, zm = $(".zoom-media")!, zi = $(".zoom-media img")!, zt = $(".zoom-txt")!, zl = $(".zoom-side.l")!, zr = $(".zoom-side.r")!;
    const team = $(".team-wrap")!, teamImg = $(".team-wrap>img")!;
    let lastY = 0, lastN = 1;
    const onScroll = () => {
      const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
      nav.classList.toggle("scrolled", y > 40);
      nav.classList.toggle("hide", y > lastY && y > 600 && !document.querySelector(".nd .mobile-menu.open")); lastY = y;
      prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      const rtl = document.documentElement.dir === "rtl";
      if (innerWidth > 1060) {
        const r = hs.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight));
        const last = track.lastElementChild as HTMLElement; const padE = parseFloat(getComputedStyle(track).paddingInlineStart) || 24; const max = Math.max(0, (rtl ? track.scrollWidth : last.offsetLeft + last.offsetWidth) + padE - innerWidth); track.style.transform = `translateX(${(rtl ? 1 : -1) * p * max}px)`;
        hsBar.style.transform = `scaleX(${p})`;
        const n = Math.min(3, 1 + Math.floor(p * 2.999)); if (n !== lastN) { lastN = n; setHsN(n); }
        const zr2 = zoom.getBoundingClientRect(), zp = clamp(-zr2.top / (zr2.height - innerHeight));
        const e = 1 - Math.pow(1 - clamp(zp / .7), 3);
        zm.style.clipPath = `inset(${22 * (1 - e)}% ${30 * (1 - e)}% ${22 * (1 - e)}% ${30 * (1 - e)}% round ${40 * (1 - e)}px)`;
        zi.style.transform = `scale(${1.3 - .3 * e})`;
        const tp = clamp((zp - .45) / .3); zt.style.opacity = String(tp); zt.style.transform = `translateY(${40 * (1 - tp)}px)`;
        zl.style.transform = `translate(${-e * 60}vw,-50%)`; zr.style.transform = `translate(${e * 60}vw,-50%)`;
      } else { zm.style.clipPath = "none"; zt.style.opacity = "1"; zt.style.transform = "none"; }
      const tr = team.getBoundingClientRect(); teamImg.style.transform = `translateY(${((tr.top + tr.height / 2 - innerHeight / 2) / innerHeight) * -70}px)`;
      // manifesto words
      const ws = $$(".manifesto .w"); if (ws.length) {
        const r = $(".manifesto")!.getBoundingClientRect();
        const p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .3)), k = Math.floor(p * ws.length * 1.05);
        ws.forEach((w, i) => w.classList.toggle("lit", i < k));
      }
    };
    on(window, "scroll", onScroll, { passive: true }); on(window, "resize", onScroll);
    (el as unknown as { __nd: () => void }).__nd = onScroll;
    onScroll();

    /* reveal */
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
    $$(".rv,.steps,.heart,.giant").forEach(n => io.observe(n));
    offs.push(() => io.disconnect());

    /* tilt + magnet + parallax */
    if (!reduce && hover) {
      $$(".tilt").forEach(n => {
        on(n, "mousemove", (e: MouseEvent) => {
          const r = n.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          n.style.setProperty("--mx", x * 100 + "%"); n.style.setProperty("--my", y * 100 + "%");
          n.style.transform = `perspective(1000px) rotateY(${(x - .5) * 9}deg) rotateX(${(.5 - y) * 9}deg) translateY(-6px)`;
        });
        on(n, "mouseleave", () => { n.style.transform = ""; });
      });
      $$(".magnet").forEach(n => {
        on(n, "mousemove", (e: MouseEvent) => { const r = n.getBoundingClientRect(); n.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .4}px)`; });
        on(n, "mouseleave", () => { n.style.transform = ""; });
      });
      const cards = $$(".card"), core = $(".core")!;
      on(window, "mousemove", e => {
        const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
        cards.forEach((c, i) => { c.style.translate = `${x * (18 + i * 12)}px ${y * (18 + i * 12)}px`; });
        core.style.translate = `${x * -12}px ${y * -12}px`;
      });
    }

    /* 3D dot sphere */
    const cv = $<HTMLCanvasElement>(".stage canvas")!, ctx = cv.getContext("2d")!;
    const DPR = Math.min(2, devicePixelRatio || 1); let S = 0;
    const N = 520, pts: [number, number, number][] = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; pts.push([Math.cos(th) * r, y, Math.sin(th) * r]); }
    const size = () => { S = cv.offsetWidth; cv.width = cv.height = S * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
    size(); on(window, "resize", size);
    let ry = 0, rx = -.3, tRy = 0, tRx = -.3, sraf = 0;
    on(cv.parentElement!, "mousemove", (e: MouseEvent) => { const r = cv.getBoundingClientRect(); tRx = -.3 + ((e.clientY - r.top) / r.height - .5) * .8; tRy = ((e.clientX - r.left) / r.width - .5) * 1.2; });
    const draw = (tm = 0) => {
      ctx.clearRect(0, 0, S, S); ry += .0035; const cyR = ry + tRy; rx += (tRx - rx) * .05;
      const R = S * .46, c = S / 2, beat = 1 + Math.max(0, Math.sin(tm / 180)) ** 18 * .04;
      const sy = Math.sin(cyR), cyy = Math.cos(cyR), sx = Math.sin(rx), cxx = Math.cos(rx);
      for (const [p0, p1, p2] of pts) {
        const x = p0 * cyy - p2 * sy; let z = p0 * sy + p2 * cyy; const y = p1 * cxx - z * sx; z = p1 * sx + z * cxx;
        const d = (z + 1) / 2, X = c + x * R * beat, Y = c + y * R * beat;
        if (Math.hypot(X - c, Y - c) < S * .24 && z > 0) continue;
        ctx.fillStyle = `rgba(${Math.round(11 + 80 * (1 - d))},${Math.round(138 + 60 * d)},${Math.round(125 + 60 * (1 - d))},${.15 + d * .75})`;
        ctx.beginPath(); ctx.arc(X, Y, .6 + d * 2.1, 0, 6.3); ctx.fill();
      }
      if (!reduce) sraf = requestAnimationFrame(draw);
    };
    draw();

    return () => { offs.forEach(f => f()); cancelAnimationFrame(raf); cancelAnimationFrame(sraf); };
  }, []);

  /* re-run scroll-derived state after a language switch */
  useEffect(() => { requestAnimationFrame(() => (root.current as unknown as { __nd?: () => void })?.__nd?.()); }, [lang]);

  /* phone chat demo */
  const [msgs, setMsgs] = useState<{ w: string; t: string; k: number }[]>([]);
  const [typing, setTyping] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [phoneOn, setPhoneOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPhoneOn(true); io.disconnect(); } }, { threshold: .3 });
    if (phoneRef.current) io.observe(phoneRef.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!phoneOn) return;
    const lines = T.chat; let i = 0, alive = true, k = 0; const tms: number[] = [];
    const later = (fn: () => void, ms: number) => tms.push(window.setTimeout(() => alive && fn(), ms));
    setMsgs([]); setTyping(false);
    const next = () => {
      if (i >= lines.length) { later(() => { setMsgs([]); i = 0; next(); }, 4200); return; }
      const [w, tx] = lines[i++];
      const add = () => setMsgs(m => [...m, { w, t: tx, k: k++ }].slice(-5));
      if (w === "bot") { setTyping(true); later(() => { setTyping(false); add(); later(next, 1300); }, 1100); }
      else { add(); later(next, 900); }
    };
    next();
    return () => { alive = false; tms.forEach(clearTimeout); };
  }, [phoneOn, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  /* manifesto tokens */
  let wi = 0;
  const manifesto = T.man.map((tok, i) => {
    if (tok === "IMG1" || tok === "IMG2")
      return <Fragment key={i}><span className="w inline-img" style={{ backgroundImage: `url(${tok === "IMG1" ? "/images/program-aide-soignant.jpg" : "/images/infra-multimedia.jpg"})` }} />{" "}</Fragment>;
    if (tok.startsWith("*")) return <Fragment key={i}><em className="w">{tok.slice(1, -1)}</em>{" "}</Fragment>;
    return <Fragment key={i}>{tok.split(" ").map(w => <Fragment key={wi++}><span className="w">{w}</span>{" "}</Fragment>)}</Fragment>;
  });

  const mq = T.mq1.map((w, i) => <Fragment key={i}><span className={i % 2 ? "o" : ""}>{w}</span><Cross /></Fragment>);
  const mq2 = [0, 1, 2].map(i => <Fragment key={i}>{t(`prog.${i}.t`)} <Cross /> </Fragment>);

  return (
    <div ref={root} className={`nd${ready ? " ready" : ""}`}>
      <div className={`loader${loaderGo ? " go" : ""}`}>
        <div className="panel-l" />
        <div className="l-in">
          <img className="l-logo" src="/ipisb-logo.png" alt="IPISB" />
          <div className="l-word">{"IPISB".split("").map((c, i) => <span key={i} style={{ animationDelay: `${.05 + i * .07}s` }}>{c}</span>)}</div>
          <div className="l-bar"><i style={{ width: pct + "%" }} /></div>
          <div className="l-pc">{pct}%</div>
        </div>
      </div>
      <div className="progress" />
      <div className="nd-cursor"><span>{T.view}</span></div>
      <div className={`nd-preview${room !== null ? " show" : ""}`}>{ROOM_IMG.map((s, i) => <img key={s} src={s} alt="" className={room === i ? "on" : ""} />)}</div>

      <NdNav />

      {/* HERO */}
      <header className="hero">
        <div className="blob" /><div className="blob b2" /><div className="dots-bg" />
        <div className="wrap">
          <div>
            <div className="chip fade d1"><b><span className="live" />{T.open}</b>{T.enroll}</div>
            <h1>
              <span className="line"><span>{T.h1a}</span></span>
              <span className="line"><span><em>{T.h1b}</em> {T.h1c}</span></span>
              <span className="line"><span><span className="rot">{T.rot.map((w, i) => <span key={w} className={`grad ${i === rotI ? "on" : i === (rotI + 2) % 3 ? "out" : ""}`}>{w}</span>)}</span></span></span>
            </h1>
            <p className="lead fade d2"><strong>{T.leadStrong}</strong>{T.lead}</p>
            <div className="hero-cta fade d3">
              <Link to="/contact" className="btn btn-p magnet">{T.ctaStart}<span className="arr"><Arrow /></span></Link>
              <button className="btn btn-g magnet" onClick={openAya}>{T.ctaAya}<span className="arr"><Bubble /></span></button>
            </div>
            <div className="mini-stats fade d4">
              <div><b><Counter to={3} /></b><small>{T.sFil}</small></div>
              <div><b><Counter to={3} /></b><small>{T.sCamp}</small></div>
              <div><b>24/7</b><small>{T.sAya}</small></div>
            </div>
          </div>
          <div className="stage fade d2">
            <canvas />
            <div className="ring-o" /><div className="ring-o r2" />
            <div className="core"><img src="/images/program-polyvalent.jpg" alt="" /></div>
            <div className="card c1"><div className="ic"><Cap /></div><div><b>{T.c1t}</b><small>{T.c1s}</small></div></div>
            <div className="card c2"><b>{T.c2t}</b><small>{T.c2s}</small>
              <svg className="ecg-mini" viewBox="0 0 200 46"><path d="M0 23 H60 L70 23 L78 8 L88 40 L98 3 L108 34 L116 23 H200" /></svg></div>
            <div className="card c3" onClick={openAya} data-link><div className="av"><img src="/aya-avatar.png" alt="" /></div><div><b>Aya</b><small>{T.c3s}</small></div></div>
          </div>
        </div>
        <a href="#nd-institut" className="scroll-ind" aria-label="Scroll">
          <svg viewBox="0 0 110 110"><defs><path id="nd-cp" d="M55 55 m-42 0 a42 42 0 1 1 84 0 a42 42 0 1 1 -84 0" /></defs><text><textPath href="#nd-cp">DÉFILER · SCROLL · اكتشف · DÉFILER · SCROLL ·</textPath></text></svg>
          <i><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M6 13l6 6 6-6" /></svg></i>
        </a>
      </header>

      <div className="marquee"><div className="track"><span>{mq}</span><span>{mq}</span></div></div>
      <div className="marquee m2"><div className="track"><span>{mq2}</span><span>{mq2}</span></div></div>

      {/* INSTITUT */}
      <section className="sec" id="nd-institut">
        <div className="wrap">
          <span className="eyebrow rv">{T.ins}</span>
          <p className="manifesto" key={lang}>{manifesto}</p>
          <div className="bento">
            <div className="cell big tilt rv">
              <div>
                <div className="ic" style={{ background: "var(--mint)", color: "var(--ink)" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
                <h3 style={{ fontSize: 30, maxWidth: 380, lineHeight: 1.15 }}>{T.bigT}</h3>
                <p style={{ maxWidth: 380 }}>{T.bigP}</p>
              </div>
              <svg className="heart" viewBox="0 0 600 130" preserveAspectRatio="none"><path d="M0 75 H120 L140 75 L155 35 L175 120 L195 10 L215 95 L230 75 H330 L345 75 L360 45 L378 110 L396 20 L414 85 L428 75 H600" /></svg>
            </div>
            <div className="cell tilt rv rv-d1"><div className="num"><Counter to={3} /></div><h3>{T.b1t}</h3><p>{T.b1p}</p></div>
            <div className="cell mint tilt rv rv-d2"><div className="num">24<span className="sl">/7</span></div><h3>{T.b2t}</h3><p>{T.b2p}</p></div>
            <div className="cell wide tilt rv rv-d1">
              <svg className="nd-ring" viewBox="0 0 130 130"><circle className="bg" cx="65" cy="65" r="55" /><circle className="fg" cx="65" cy="65" r="55" /></svg>
              <div className="num"><Counter to={3} /></div>
              <h3 style={{ maxWidth: "60%" }}>{T.b3t}</h3><p style={{ maxWidth: "60%" }}>{T.b3p}</p>
            </div>
            <div className="cell cell-img full rv rv-d2"><img src="/images/infra-simulation.jpg" alt="" /><div className="cap"><span className="tag">{T.labTag}</span><h3>{T.labT}</h3></div></div>
          </div>
        </div>
      </section>

      {/* PROGRAMS — horizontal */}
      <section className="hscroll">
        <div className="hs-sticky">
          <div className="wrap hs-head">
            <div><span className="eyebrow">{T.filEye}</span><h2>{T.filA}<em>{T.filB}</em>.</h2></div>
            <div className="hs-count"><b>0{hsN}</b> / 03</div>
          </div>
          <div className="hs-track">
            {[0, 1, 2].map(i => {
              const tags = t(`prog.${i}.tags`).split(",");
              return (
                <article key={i} className={`prog ${PROG_CLS[i]}`}>
                  <div className="pimg" data-view><img src={PROG_IMG[i]} alt="" /><span className="pidx">/0{i + 1}</span></div>
                  <div className="pbody">
                    <div>
                      <div className="tagrow"><span className="tag">{tags[0]}</span></div>
                      <h3>{t(`prog.${i}.t`)}</h3>
                      <p>{t(`prog.${i}.d`)}</p>
                      <ul>{tags.map(g => <li key={g}>{g}</li>)}</ul>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
                      <Link to="/contact" className={`btn ${i === 1 ? "btn-g" : "btn-p"}`}>{T.apply}<span className="arr"><Arrow /></span></Link>
                      <Link to="/formations" className="btn btn-g" style={i === 1 ? { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.25)" } : undefined}>{t("prog.discover").replace(/[→←]/g, "").trim()}</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="wrap"><div className="hs-bar"><i /></div></div>
        </div>
      </section>

      {/* ZOOM */}
      <section className="zoom">
        <div className="zoom-sticky">
          <div className="zoom-side l">{T.zl}</div><div className="zoom-side r">{T.zr}</div>
          <div className="zoom-media"><img src="/images/team-faculty.jpg" alt="" /></div>
          <div className="zoom-txt"><h2>{T.zoomA}<em>{T.zoomB}</em><br />{T.zoomC}</h2><p>{T.zoomP}</p></div>
        </div>
      </section>

      {/* PARCOURS */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow rv">{T.parEye}</span><h2 className="rv rv-d1">{T.parA}<br /><em>{T.parB}</em>.</h2></div>
            <p className="rv rv-d2">{T.parP}</p>
          </div>
          <div className="steps rv">
            {T.steps.map(([h, p], i) => (
              <div className="step" key={i}>
                <span className="sn">STEP 0{i + 1}</span>
                <div className="sic">
                  {[<svg key="a" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
                    <svg key="b" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
                    <svg key="c" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></svg>,
                    <Cap key="d" />][i]}
                </div>
                <h4>{h}</h4><p>{p}</p><div className="bar"><i /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESPACES */}
      <section className="sec" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head">
            <div><span className="eyebrow rv">{T.campEye}</span><h2 className="rv rv-d1">{T.campA}<br /><em>{T.campB}</em>.</h2></div>
            <p className="rv rv-d2">{T.campP}</p>
          </div>
          <div className="clist">
            {T.rooms.map(([h, d], i) => (
              <div key={i} className={`crow rv rv-d${i}`} data-view onMouseEnter={() => setRoom(i)} onMouseLeave={() => setRoom(null)}>
                <span className="cn">0{i + 1}</span><h3>{h}</h3><span className="cd">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AYA */}
      <section className="sec aya">
        <div className="wrap aya-grid">
          <div>
            <span className="eyebrow rv">{T.ayaEye}</span>
            <h2 className="rv rv-d1" style={{ whiteSpace: "pre-line" }}>{T.ayaA}<span className="grad">{lang === "ar" ? "آية" : "Aya"}</span>{T.ayaB}<em>{T.ayaC}</em>.</h2>
            <p className="rv rv-d2" style={{ color: "var(--ink-2)", marginTop: 22, maxWidth: 480, fontSize: 17 }}>{T.ayaP}</p>
            <div className="feature-list">
              {T.fi.map(([b, s], i) => (
                <div key={i} className={`fi rv rv-d${i}`}>
                  <div className="ic">{[<svg key="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>, <Cap key="c" />, <svg key="d" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>][i]}</div>
                  <div><b>{b}</b><small>{s}</small></div>
                </div>
              ))}
            </div>
            <button className="btn btn-p magnet rv" style={{ marginTop: 26 }} onClick={openAya}>{T.ctaAya}<span className="arr"><Bubble /></span></button>
          </div>
          <div className="phone-wrap rv rv-d1" ref={phoneRef}>
            <div className="phone tilt">
              <div className="screen">
                <div className="notch" />
                <div className="chat-top"><div className="av"><img src="/aya-avatar.png" alt="" /></div><div><b>Aya · IPISB</b><small>{T.online}</small></div></div>
                <div className="msgs">
                  {msgs.map(m => <div key={m.k} className={`msg ${m.w}`}>{m.t}</div>)}
                  {typing && <div className="msg bot typing"><i /><i /><i /></div>}
                </div>
                <div className="quick">{T.quick.map(q => <span key={q}>{q}</span>)}</div>
                <div className="inputbar" onClick={openAya}>{T.ask}<span className="send"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21 23 12 2 3v7l15 2-15 2z" /></svg></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="sec" style={{ paddingTop: 40, paddingBottom: 0 }}>
        <div className="wrap">
          <div className="team-wrap rv">
            <img src="/images/infra-simulation.jpg" alt="" />
            <div className="team-cap">
              <div><span className="eyebrow">{T.misEye}</span><h2>{T.misA}<em>{T.misB}</em>{T.misC}</h2></div>
              <div className="quote"><span className="serif">“</span>{T.quote}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="wrap">
          <div className="cta-box rv">
            <div className="blob" /><div className="blob b2" />
            <span className="cross" style={{ top: "12%", left: "8%" }}><Cross s={70} /></span>
            <span className="cross" style={{ bottom: "14%", right: "9%", animationDelay: "-4s" }}><Cross s={100} /></span>
            <span className="eyebrow">{T.ctaEye}</span>
            <div className="big-t">{T.ctaA}<br />{T.ctaB}<span className="serif">{T.ctaC}</span></div>
            <p>{T.ctaP}</p>
            <div className="hero-cta">
              <Link to="/contact" className="btn btn-p magnet">{T.ctaBtn}<span className="arr"><Arrow /></span></Link>
              <button className="btn btn-g magnet" onClick={openAya}>{T.ctaAsk}<span className="arr"><Bubble /></span></button>
            </div>
            <div className="badge-row">{T.camps.map(s => <span key={s}>📍 {s}</span>)}</div>
          </div>
        </div>
      </section>

      <NdFooter />
    </div>
  );
}
