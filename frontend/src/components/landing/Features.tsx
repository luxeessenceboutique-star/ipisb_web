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

const L = {
  paper:   "oklch(99% 0.005 160)",
  ink:     "oklch(22% 0.025 175)",
  text:    "oklch(34% 0.03 180)",
  muted:   "oklch(52% 0.02 180)",
  primary: "oklch(48% 0.085 175)",
  teal:    "oklch(62% 0.085 170)",
  amber:   "oklch(78% 0.12 80)",
  green:   "oklch(70% 0.13 155)",
  line:    "oklch(88% 0.015 170)",
};
// Dark card tokens — the interactive module panel sits as a mockup card
// inside the (light) section rather than a full-bleed dark section, so the
// homepage doesn't stack this on top of the dark LanguageOptions section.
const D = {
  ink:    "oklch(22% 0.025 175)",
  panel:  "oklch(27% 0.03 175)",
  line:   "oklch(38% 0.03 175)",
  paper:  "oklch(98% 0.005 160)",
  muted:  "oklch(70% 0.02 180)",
};
const serif = '"Cormorant Garamond", Georgia, serif';
const sans  = '"Manrope", system-ui, sans-serif';
const mono  = '"JetBrains Mono", ui-monospace, monospace';

const ITEM_META: { n: string; Icon: LucideIcon; accent: string }[] = [
  { n: "01", Icon: GraduationCap,  accent: L.primary },
  { n: "02", Icon: ClipboardList,  accent: L.amber   },
  { n: "03", Icon: BarChart2,      accent: L.green   },
  { n: "04", Icon: CalendarDays,   accent: L.teal    },
  { n: "05", Icon: MessageSquare,  accent: L.primary },
  { n: "06", Icon: BookOpen,       accent: L.amber   },
  { n: "07", Icon: Microscope,     accent: L.green   },
  { n: "08", Icon: HeartPulse,     accent: L.teal    },
];

// Scroll-pinned selector tuning — see mossy-weaving-petal.md for the
// full reasoning behind these two numbers.
const STEP_VH = 32;    // vh of scroll runway per module (8 * 32 = 256vh total)
const NAV_OFFSET = 88; // px — clears SiteNav's own sticky header + a gap

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Nodes sweep a 180° arc (bottom → left → top) instead of a full circle,
// matching LangChain's half-circle reference rather than a closed ring.
const ARC_START = 90;
const ARC_END = 270;

function ModuleOrbit({
  active, onSelect, size,
}: { active: number; onSelect: (i: number) => void; size: number }) {
  const cx = size / 2, cy = size / 2;
  const orbitR = size * 0.42;
  const satR = size * 0.09;
  const hubR = size * 0.11;
  const ringRs = [size * 0.30, size * 0.42, size * 0.5];

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        {ringRs.map((r) => (
          <path
            key={r}
            d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r}`}
            fill="none" stroke={D.line} strokeWidth={1} opacity={0.35}
          />
        ))}
        {ITEM_META.map((meta, i) => {
          const angle = ARC_START + i * ((ARC_END - ARC_START) / (ITEM_META.length - 1));
          const p = polar(cx, cy, orbitR, angle);
          const isActive = active === i;
          return (
            <line
              key={meta.n}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke={isActive ? meta.accent : D.line}
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 0.9 : 0.4}
              style={{ transition: "stroke .3s, opacity .3s" }}
            />
          );
        })}
      </svg>

      <div style={{
        position: "absolute", left: cx - hubR, top: cy - hubR, width: hubR * 2, height: hubR * 2,
        borderRadius: "50%", background: D.panel, border: `1px solid ${D.line}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 30px oklch(0% 0 0 / .3)",
      }}>
        <Logo size={hubR * 1.15} />
      </div>

      {ITEM_META.map((meta, i) => {
        const angle = ARC_START + i * ((ARC_END - ARC_START) / (ITEM_META.length - 1));
        const p = polar(cx, cy, orbitR, angle);
        const isActive = active === i;
        const { Icon } = meta;
        return (
          <button
            key={meta.n}
            onClick={() => onSelect(i)}
            aria-label={meta.n}
            style={{
              position: "absolute", left: p.x - satR, top: p.y - satR, width: satR * 2, height: satR * 2,
              borderRadius: "50%", cursor: "pointer",
              background: isActive ? meta.accent : D.panel,
              border: `1px solid ${isActive ? meta.accent : D.line}`,
              color: isActive ? D.ink : D.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isActive ? `0 0 22px ${meta.accent}66` : "none",
              transition: "background .25s, border-color .25s, box-shadow .25s, color .25s, transform .2s",
              transform: isActive ? "scale(1.12)" : "scale(1)",
            }}
          >
            <Icon size={satR * 0.75} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

export function Features() {
  const { t } = useI18n();
  const { isMobile, isTablet } = useBreakpoint();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const [reducedMotion] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const scrollDriven = !isMobile && !reducedMotion;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    if (panelRef.current) obs.observe(panelRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollDriven) return;

    const computeActive = () => {
      rafRef.current = null;
      const wrapperEl = wrapperRef.current, panelEl = panelRef.current;
      if (!wrapperEl || !panelEl) return;
      const runway = Math.max(wrapperEl.offsetHeight - panelEl.offsetHeight, 1);
      const raw = -wrapperEl.getBoundingClientRect().top / runway;
      const progress = Math.min(Math.max(raw, 0), 1);
      const idx = Math.min(Math.floor(progress * ITEM_META.length), ITEM_META.length - 1);
      setActive((prev) => (prev === idx ? prev : idx));
    };

    const onScrollOrResize = () => {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(computeActive);
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

  function handleSelect(i: number) {
    if (!scrollDriven) { setActive(i); return; }
    const wrapperEl = wrapperRef.current, panelEl = panelRef.current;
    if (!wrapperEl || !panelEl) { setActive(i); return; }
    const wrapperTop = wrapperEl.getBoundingClientRect().top + window.scrollY;
    const runway = Math.max(wrapperEl.offsetHeight - panelEl.offsetHeight, 0);
    const targetProgress = (i + 0.5) / ITEM_META.length;
    window.scrollTo({ top: wrapperTop + targetProgress * runway });
  }

  const pad = isMobile ? "64px 20px" : isTablet ? "80px 32px" : "120px 40px";
  const activeMeta = ITEM_META[active];
  const ActiveIcon = activeMeta.Icon;

  return (
    <section style={{ background: L.paper, padding: pad, borderTop: `1px solid ${L.line}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
          gap: isMobile ? 20 : 72, marginBottom: isMobile ? 40 : 64, alignItems: "end",
        }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 11, color: L.primary, letterSpacing: ".16em", textTransform: "uppercase" as const, fontWeight: 700, marginBottom: 12 }}>{t("feat.eyebrow")}</div>
            <h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: "clamp(38px, 4.5vw, 60px)", lineHeight: .98, color: L.ink, margin: 0, letterSpacing: "-.02em" }}>
              {t("feat.h2a")}<br /><em style={{ fontStyle: "italic", color: L.primary }}>{t("feat.h2b")}</em>
            </h2>
          </div>
          <p style={{ fontFamily: sans, fontSize: isMobile ? 15 : 17, lineHeight: 1.65, color: L.text, maxWidth: 520, margin: 0, alignSelf: "end" }}>
            {t("feat.body")}
          </p>
        </div>

        <div ref={wrapperRef} style={{ position: "relative", height: scrollDriven ? `${ITEM_META.length * STEP_VH}vh` : "auto" }}>
          <div ref={panelRef} style={{
            position: scrollDriven ? "sticky" : "static",
            top: scrollDriven ? NAV_OFFSET : undefined,
            background: D.ink, borderRadius: 28, overflow: "hidden",
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "480px 1fr",
            minHeight: isMobile ? undefined : 560,
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity .7s, transform .7s",
          }}>
            <div style={{
              padding: isMobile ? "44px 16px" : "48px 24px",
              borderRight: isMobile ? "none" : `1px solid ${D.line}`, borderBottom: isMobile ? `1px solid ${D.line}` : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ModuleOrbit active={active} onSelect={handleSelect} size={isMobile ? 320 : 420} />
            </div>

            <div style={{ padding: isMobile ? "32px 24px" : "56px 64px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, marginBottom: 24,
                background: activeMeta.accent + "22", border: `1px solid ${activeMeta.accent}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ActiveIcon size={26} strokeWidth={1.5} color={activeMeta.accent} />
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: activeMeta.accent, letterSpacing: ".1em", marginBottom: 10 }}>
                MODULE {activeMeta.n}
              </div>
              <h3 style={{ fontFamily: serif, fontWeight: 500, fontSize: isMobile ? 28 : 38, color: D.paper, margin: "0 0 16px", lineHeight: 1.05 }}>
                {t(`feat.${activeMeta.n}`)}
              </h3>
              <p style={{ fontFamily: sans, fontSize: isMobile ? 14 : 16, lineHeight: 1.7, color: D.muted, margin: "0 0 28px", maxWidth: 480 }}>
                {t(`feat.${activeMeta.n}.d`)}
              </p>
              <Link to="/plateforme" style={{
                display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
                background: "transparent", border: `1px solid ${activeMeta.accent}`, color: activeMeta.accent,
                fontFamily: sans, fontSize: 13, fontWeight: 700, borderRadius: 999,
                padding: "10px 20px", textDecoration: "none",
              }}>
                {t("feat.explore")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
