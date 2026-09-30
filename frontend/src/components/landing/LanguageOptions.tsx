import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { Logo } from "@/components/Logo";
import type { Lang } from "@/lib/i18n";

const D = {
  ink:    "oklch(22% 0.025 175)",
  panel:  "oklch(27% 0.03 175)",
  line:   "oklch(38% 0.03 175)",
  paper:  "oklch(98% 0.005 160)",
  muted:  "oklch(70% 0.02 180)",
  primary:"oklch(62% 0.11 170)",
  amber:  "oklch(78% 0.12 80)",
  green:  "oklch(70% 0.13 155)",
};
const serif = '"Cormorant Garamond", Georgia, serif';
const sans  = '"Manrope", system-ui, sans-serif';
const mono  = '"JetBrains Mono", ui-monospace, monospace';

const LANGS: { id: Lang; color: string; angle: number }[] = [
  { id: "fr", color: D.primary, angle: -90 },
  { id: "en", color: D.amber,   angle: 30 },
  { id: "ar", color: D.green,   angle: 150 },
];

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function OrbitDiagram({
  size, active, onSelect,
}: { size: number; active: Lang; onSelect: (l: Lang) => void }) {
  const cx = size / 2, cy = size / 2;
  const orbitR = size * 0.38;
  const satR = size * 0.13;
  const hubR = size * 0.15;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        {LANGS.map((l) => {
          const p = polar(cx, cy, orbitR, l.angle);
          const isActive = active === l.id;
          return (
            <line
              key={l.id}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke={isActive ? l.color : D.line}
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 0.9 : 0.5}
              style={{ transition: "stroke .3s, opacity .3s" }}
            />
          );
        })}
      </svg>

      {/* Hub */}
      <div style={{
        position: "absolute", left: cx - hubR, top: cy - hubR, width: hubR * 2, height: hubR * 2,
        borderRadius: "50%", background: D.panel, border: `1px solid ${D.line}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 30px oklch(0% 0 0 / .3)",
      }}>
        <Logo size={hubR} />
      </div>

      {/* Satellites */}
      {LANGS.map((l) => {
        const p = polar(cx, cy, orbitR, l.angle);
        const isActive = active === l.id;
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            aria-label={l.id}
            style={{
              position: "absolute", left: p.x - satR, top: p.y - satR, width: satR * 2, height: satR * 2,
              borderRadius: "50%", cursor: "pointer",
              background: isActive ? l.color : D.panel,
              border: `1px solid ${isActive ? l.color : D.line}`,
              color: isActive ? D.ink : D.paper,
              fontFamily: mono, fontWeight: 700, fontSize: satR * 0.42,
              textTransform: "uppercase" as const, letterSpacing: ".04em",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: isActive ? `0 0 24px ${l.color}66` : "none",
              transition: "background .3s, border-color .3s, box-shadow .3s, transform .2s",
              transform: isActive ? "scale(1.08)" : "scale(1)",
            }}
          >
            {l.id}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageOptions() {
  const { t, lang, setLang } = useI18n();
  const { isMobile, isTablet } = useBreakpoint();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<Lang>("fr");

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const pad = isMobile ? "64px 20px" : isTablet ? "80px 32px" : "100px 40px";
  const diagramSize = isMobile ? 240 : isTablet ? 280 : 320;
  const activeLang = LANGS.find(l => l.id === active)!;

  return (
    <section ref={ref} style={{ background: D.ink, padding: pad }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ maxWidth: 640, marginBottom: isMobile ? 40 : 64 }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: activeLang.color, letterSpacing: ".16em", textTransform: "uppercase" as const, fontWeight: 700, marginBottom: 12, transition: "color .3s" }}>{t("lang.eyebrow")}</div>
          <h2 style={{ fontFamily: serif, fontWeight: 500, fontSize: "clamp(32px, 4.5vw, 54px)", lineHeight: 1, color: D.paper, margin: 0, letterSpacing: "-.02em" }}>
            {t("lang.h2a")}<br /><em style={{ fontStyle: "italic", color: activeLang.color, transition: "color .3s" }}>{t("lang.h2b")}</em>
          </h2>
          <p style={{ fontFamily: sans, fontSize: isMobile ? 14 : 16, lineHeight: 1.65, color: D.muted, marginTop: 20 }}>{t("lang.body")}</p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "auto 1fr",
          gap: isMobile ? 40 : 72,
          alignItems: "center",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity .7s, transform .7s",
        }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <OrbitDiagram size={diagramSize} active={active} onSelect={setActive} />
          </div>

          <div style={{
            background: D.panel, border: `1px solid ${D.line}`, borderRadius: 24,
            padding: isMobile ? "28px 24px" : "40px 44px",
          }}>
            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: activeLang.color, letterSpacing: ".1em", textTransform: "uppercase" as const, marginBottom: 10, transition: "color .3s" }}>
              {t(`lang.${active}.label`)}
            </div>
            <p style={{ fontFamily: sans, fontSize: isMobile ? 15 : 17, lineHeight: 1.7, color: D.paper, margin: "0 0 24px" }}>
              {t(`lang.${active}.desc`)}
            </p>
            <button
              onClick={() => setLang(active)}
              disabled={lang === active}
              style={{
                background: "transparent", border: `1px solid ${activeLang.color}`, color: activeLang.color,
                fontFamily: sans, fontSize: 13, fontWeight: 700, borderRadius: 999,
                padding: "10px 20px", cursor: lang === active ? "default" : "pointer",
                opacity: lang === active ? 0.5 : 1, transition: "opacity .2s, color .3s, border-color .3s",
              }}
            >
              {lang === active ? t(`lang.${active}.label`) : t("lang.cta").replace("{label}", t(`lang.${active}.label`))}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
