import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { Logo } from "@/components/Logo";
import {
  GraduationCap,
  ClipboardList,
  BarChart2,
  CalendarDays,
  MessageSquare,
  BookOpen,
  Microscope,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

// Design handoff: "Modules Scroll" — full-bleed, scroll-pinned rotating
// wheel replacing the previous half-circle orbit. Geometry, easing and
// scroll logic follow the handoff spec precisely (see design_handoff_modules_scroll).
const D = {
  ink:    "oklch(22% 0.025 175)",
  panel:  "oklch(27% 0.03 175)",
  line:   "oklch(38% 0.03 175)",
  primary:"oklch(48% 0.085 175)",
  accent: "oklch(62% 0.085 170)",
  paper:  "oklch(98% 0.005 160)",
  muted:  "oklch(70% 0.02 180)",
};
const serif = '"Cormorant Garamond", Georgia, serif';
const sans  = '"Manrope", system-ui, sans-serif';
const mono  = '"JetBrains Mono", ui-monospace, monospace';

const MOD_META: { n: string; label: string; Icon: LucideIcon }[] = [
  { n: "01", label: "Cours",        Icon: GraduationCap },
  { n: "02", label: "Contrôle",     Icon: ClipboardList },
  { n: "03", label: "QCM",          Icon: BarChart2 },
  { n: "04", label: "Agenda",       Icon: CalendarDays },
  { n: "05", label: "Messages",     Icon: MessageSquare },
  { n: "06", label: "Bibliothèque", Icon: BookOpen },
  { n: "07", label: "Recherche",    Icon: Microscope },
  { n: "08", label: "Bien-être",    Icon: HeartPulse },
];

const N = MOD_META.length;
const STEP = 360 / N;
const STEP_VH = 70;      // vh of scroll runway per module
const SHOW_MOCKUP = true;

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export function Features() {
  const { t } = useI18n();
  const { isMobile } = useBreakpoint();
  const sectionRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [ri, setRi] = useState(0);
  const [vw, setVw] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440));
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const scrollDriven = !isMobile && !reducedMotion;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollDriven) return;

    const update = () => {
      rafRef.current = null;
      const el = sectionRef.current;
      if (!el) return;
      const runway = Math.max(el.offsetHeight - window.innerHeight, 1);
      const p = clamp(-el.getBoundingClientRect().top / runway, 0, 1);
      const tt = p * N;
      const idx = Math.min(Math.floor(tt), N - 1);
      const nextRi = idx === N - 1 ? idx : idx + ease(clamp((tt - idx - 0.55) / 0.45, 0, 1));
      setRi((prev) => (Math.abs(nextRi - prev) > 0.0005 ? nextRi : prev));
      setVw(window.innerWidth);
    };

    const onScrollOrResize = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    onScrollOrResize();

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [scrollDriven]);

  const active = Math.round(ri);

  function goTo(i: number) {
    if (!scrollDriven) { setRi(i); return; }
    const el = sectionRef.current;
    if (!el) { setRi(i); return; }
    const runway = el.offsetHeight - window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.2) / N) * runway });
  }

  // Geometry (see handoff README for derivation)
  const showMock = SHOW_MOCKUP && !isMobile && vw >= 1100;
  const R = vw >= 1100 ? 280 : vw >= 760 ? 230 : 170;
  const cx = -R * 0.35;
  const edge = cx + R;
  const contentLeft = edge + (vw >= 1100 ? Math.max(140, vw * 0.12) : 64);
  const mockLeft = vw * 0.6;
  const contentWidth = showMock ? Math.min(460, mockLeft - contentLeft - 56) : Math.min(520, vw - contentLeft - 28);
  const mockWidth = Math.max(vw * 0.5, 620);
  const rot = -ri * STEP;
  const wheelLeft = cx - R;
  const lineLeft = edge + 42;
  const lineWidth = Math.max(contentLeft - edge - 66, 0);

  const stageHeight = scrollDriven ? "100vh" : isMobile ? 760 : 620;

  return (
    <section ref={sectionRef} style={{
      position: "relative",
      height: scrollDriven ? `calc(${N * STEP_VH}vh + 100vh)` : "auto",
      background: D.ink,
      fontFamily: sans,
      opacity: visible ? 1 : 0,
      transition: "opacity .8s",
    }}>
      <div ref={wrapperRef} style={{
        position: scrollDriven ? "sticky" : "static",
        top: 0,
        height: stageHeight,
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 60% 70% at 0% 58%, oklch(48% 0.085 175 / .16), transparent 70%)",
        }} />

        {/* Header */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: isMobile ? "4vh" : "7vh",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          padding: "0 24px", textAlign: "center" as const,
        }}>
          <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: ".18em", textTransform: "uppercase" as const, color: D.accent }}>
            {t("feat.eyebrow")}
          </div>
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 500, fontSize: "clamp(32px, 5.2vw, 76px)", lineHeight: .98, letterSpacing: "-.02em", color: D.paper }}>
            {t("feat.h2a")} <em style={{ fontStyle: "italic", color: D.accent }}>{t("feat.h2b")}</em>
          </h2>
        </div>

        {/* Stage */}
        <div style={{ position: "absolute", left: 0, right: 0, top: isMobile ? "22vh" : "26vh", bottom: "4vh" }}>
          {/* Wheel */}
          <div style={{ position: "absolute", left: wheelLeft, top: `calc(50% - ${R}px)`, width: R * 2, height: R * 2 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${D.line}`,
              background: "radial-gradient(circle, transparent 58%, oklch(27% 0.03 175 / .55) 100%)",
            }} />
            <div style={{ position: "absolute", inset: 78, borderRadius: "50%", border: "1px solid oklch(38% 0.03 175 / .45)" }} />
            <div style={{ position: "absolute", inset: 156, borderRadius: "50%", border: "1px dashed oklch(38% 0.03 175 / .35)" }} />

            {MOD_META.map((m, i) => {
              const a = i * STEP;
              const on = i === active;
              const { Icon } = m;
              return (
                <button
                  key={m.n}
                  onClick={() => goTo(i)}
                  aria-label={t(`feat.${m.n}`)}
                  style={{
                    position: "absolute", left: "50%", top: "50%", width: 0, height: 0, padding: 0, border: 0,
                    background: "none", cursor: "pointer",
                    transform: `rotate(${a + rot}deg) translateX(${R}px) rotate(${-(a + rot)}deg)`,
                  }}
                >
                  <span style={{
                    position: "absolute", left: 0, top: 0, transform: "translate(-50%,-50%)",
                    display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 14px",
                    borderRadius: 999, border: `1px solid ${D.line}`, background: D.ink, color: D.muted,
                    fontFamily: mono, fontSize: 12, whiteSpace: "nowrap" as const,
                    opacity: on ? 0 : 1, transition: "opacity .35s",
                  }}>
                    {m.label}
                  </span>
                  <span style={{
                    position: "absolute", left: 0, top: 0, width: 68, height: 68,
                    transform: `translate(-50%,-50%) scale(${on ? 1 : 0.6})`,
                    borderRadius: "50%", background: D.primary, border: `1px solid ${D.accent}`,
                    boxShadow: "0 0 0 8px oklch(48% 0.085 175 / .14), 0 0 36px oklch(48% 0.085 175 / .45)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: D.paper,
                    opacity: on ? 1 : 0, transition: "opacity .35s, transform .45s cubic-bezier(.22,1,.36,1)",
                  }}>
                    <Icon size={26} strokeWidth={1.5} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Connector line */}
          {!isMobile && (
            <div style={{
              position: "absolute", left: lineLeft, width: lineWidth, top: "50%", height: 1,
              background: `linear-gradient(90deg, ${D.accent}, oklch(62% 0.085 170 / 0))`,
            }} />
          )}

          {/* Content column */}
          <div style={{ position: "absolute", left: contentLeft, width: contentWidth, top: 0, bottom: 0 }}>
            {MOD_META.map((m, i) => {
              const on = i === active;
              const dy = (i - active) * 28;
              return (
                <div key={m.n} style={{
                  position: "absolute", left: 0, right: 0, top: "50%",
                  transform: `translateY(-50%) translateY(${dy}px)`,
                  opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none",
                  transition: "opacity .45s, transform .6s cubic-bezier(.22,1,.36,1)",
                  display: "flex", flexDirection: "column", gap: 18,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: mono, fontSize: 11, fontWeight: 700, letterSpacing: ".14em", color: D.accent }}>
                    <span>MODULE {m.n}</span>
                    <span style={{ width: 28, height: 1, background: D.line }} />
                    <span style={{ color: D.muted, fontWeight: 400 }}>{m.n} / 08</span>
                  </div>
                  <h3 style={{ margin: 0, fontFamily: serif, fontWeight: 500, fontSize: "clamp(30px, 4.4vw, 64px)", lineHeight: 1, letterSpacing: "-.015em", color: D.paper }}>
                    {t(`feat.${m.n}`)}
                  </h3>
                  <p style={{ margin: 0, fontSize: "clamp(15px, 1.5vw, 22px)", lineHeight: 1.5, color: D.accent }}>
                    {t(`feat.${m.n}.d`)}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                    {(["b1", "b2", "b3"] as const).map((b) => (
                      <div key={b} style={{ display: "flex", gap: 14, alignItems: "baseline", fontSize: 15, lineHeight: 1.5, color: D.muted }}>
                        <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: "50%", background: D.accent, transform: "translateY(-2px)" }} />
                        <span><strong style={{ fontWeight: 600, color: D.paper }}>{t(`feat.${m.n}.${b}b`)}</strong> {t(`feat.${m.n}.${b}r`)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginTop: 18 }}>
                    <Link to="/plateforme" style={{
                      display: "inline-flex", alignItems: "center", gap: 10, height: 40, padding: "0 18px",
                      borderRadius: 8, border: `1px solid ${D.line}`, color: D.paper,
                      fontFamily: mono, fontSize: 13, fontWeight: 600, textDecoration: "none",
                    }}>
                      {t("feat.explore")} <span>↗</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mockup card */}
          {showMock && (
            <div style={{
              position: "absolute", left: mockLeft, width: mockWidth, top: "50%",
              height: "min(64vh, 560px)", transform: "translateY(-50%)",
              borderRadius: 20, border: `1px solid ${D.line}`, background: D.panel,
              boxShadow: "0 30px 80px oklch(0% 0 0 / .45), 0 0 0 6px oklch(27% 0.03 175 / .35)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 22, height: 52, padding: "0 22px", borderBottom: `1px solid ${D.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: D.paper, whiteSpace: "nowrap" as const }}>
                  <Logo size={22} /> IPISB Connect
                </div>
                <div style={{ display: "flex", gap: 18, overflow: "hidden" }}>
                  {MOD_META.map((m, i) => (
                    <span key={m.n} style={{
                      flexShrink: 0, fontSize: 12, whiteSpace: "nowrap" as const, padding: "17px 0",
                      color: i === active ? D.paper : D.muted,
                      borderBottom: `1px solid ${i === active ? D.accent : "transparent"}`,
                      transition: "color .3s, border-color .3s",
                    }}>
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                {MOD_META.map((m, i) => {
                  const on = i === active;
                  return (
                    <div key={m.n} style={{
                      position: "absolute", inset: 18, opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none",
                      transform: `scale(${on ? 1 : 0.97})`, transition: "opacity .45s, transform .6s cubic-bezier(.22,1,.36,1)",
                      borderRadius: 12, border: `1px dashed ${D.line}`, background: D.ink,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontFamily: sans, fontSize: 13, color: D.muted, textAlign: "center" as const, padding: 16 }}>
                        Capture d'écran — {t(`feat.${m.n}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
