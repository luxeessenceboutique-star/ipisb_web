import { useEffect, useRef, useState } from "react";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { useI18n } from "@/lib/i18n";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:9000";

// ── Design tokens ────────────────────────────────────────────────────────────
const D = {
  bg:       "#ffffff",
  card:     "#ffffff",
  card2:    "#f4faf9",
  border:   "rgba(6,32,29,.10)",
  ink:      "#06201d",
  teal:     "#0b8a7d",
  teal2:    "#12b5a2",
  mint:     "#5fe3c4",
  mintSoft: "#d6f7ef",
  paper:    "#ffffff",
  muted:    "#6b827e",
  green:    "#1fa463",
  red:      "#e5484d",
};
const sans  = '"Manrope", system-ui, sans-serif';
const mono  = '"JetBrains Mono", ui-monospace, monospace';

// ── Types ─────────────────────────────────────────────────────────────────────
type Lang  = "fr" | "en" | "ar" | "darija";
type Stage = "chat" | "collect_info" | "review" | "confirmed";

interface Msg {
  role:    "user" | "assistant";
  content: string;
}

interface DocInfo {
  url:      string;
  filename: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const LANGS = [
  { code: "fr"     as Lang, flag: "🇫🇷", label: "Français",  sub: "Je parle français",  rtl: false },
  { code: "ar"     as Lang, flag: "🇸🇦", label: "العربية",   sub: "أتحدث العربية",      rtl: true  },
  { code: "en"     as Lang, flag: "🇬🇧", label: "English",   sub: "I speak English",    rtl: false },
  { code: "darija" as Lang, flag: "🇲🇦", label: "الدارجة",   sub: "كنهضر بالدارجة",    rtl: true  },
];

const STAGE_LABELS: Record<Stage, string> = {
  chat:         "",
  collect_info: "Étape 1/3 — Informations",
  review:       "Étape 2/3 — Récapitulatif",
  confirmed:    "Étape 3/3 — Confirmé",
};

const WELCOME: Record<Lang, string> = {
  fr:     "Bonjour ! Je suis **Aya**, votre conseillère IPISB 🎓\n\nComment puis-je vous aider ? Je peux vous informer sur nos formations, vous aider à choisir votre filière, ou vous guider dans votre inscription.",
  en:     "Hello! I'm **Aya**, your IPISB advisor 🎓\n\nHow can I help you? I can tell you about our programs, help you choose the right field, or guide you through enrollment.",
  ar:     "مرحباً! أنا **آية**، مستشارتك في معهد IPISB 🎓\n\nكيف يمكنني مساعدتك؟ يمكنني إخبارك عن برامجنا، ومساعدتك في اختيار تخصصك، أو إرشادك في عملية التسجيل.",
  darija: "Mrhba bik! Ana **Aya**, l-mstashara dyalkom f IPISB 🎓\n\nKifach nqder n3awnek? Nqder n7kiwlek 3la formations, n3awnek tkhtarek filière dyalek, wla n3awnek f inscription.",
};

const SUGGESTIONS: Record<Lang, string[]> = {
  fr:     ["Formations disponibles", "Comment s'inscrire ?", "Quel programme choisir ?"],
  en:     ["Available programs", "How to enroll?", "Which program suits me?"],
  ar:     ["البرامج المتاحة", "كيف أسجّل؟", "أي تخصص يناسبني؟"],
  darija: ["Formations disponibles", "Kifach nsejjel?", "Anhi filière?"],
};

const PLACEHOLDER: Record<Lang, string> = {
  fr:     "Posez votre question…",
  en:     "Ask your question…",
  ar:     "اكتب سؤالك هنا…",
  darija: "Kteb so2alek…",
};

// ── Local KB fallback (unchanged from original) ───────────────────────────────
const LOCAL_KB: Record<Lang, { patterns: RegExp[]; answer: string }[]> = {
  fr: [
    {
      patterns: [/inscri/i, /s'inscrire/i, /candidature/i, /dossier/i, /admission/i],
      answer: `**Comment s'inscrire à l'IPISB ?**\n\nContactez-nous directement :\n📞 **+212 632-822898**\n✉️ **contact@ipisb.ma**\n🕐 **Lun–Sam 08:00–18:30**`,
    },
    {
      patterns: [/formation/i, /filière/i, /programme/i],
      answer: `**Nos 3 formations :**\n\n🏥 **Infirmier Polyvalent** — 3 ans\n👩‍⚕️ **Infirmier Auxiliaire** — 2 ans\n🤝 **Aide-Soignant** — 1 an`,
    },
    {
      patterns: [/bonjour/i, /salut/i, /hello/i],
      answer: `Bonjour ! Je suis **Aya**, votre conseillère IPISB 🎓\nComment puis-je vous aider ?`,
    },
  ],
  en: [
    {
      patterns: [/enroll/i, /register/i, /apply/i],
      answer: `**How to enroll?**\n\n📞 +212 632-822898\n✉️ contact@ipisb.ma`,
    },
    {
      patterns: [/hello/i, /hi\b/i],
      answer: `Hello! I'm **Aya**, your IPISB advisor 🎓\nHow can I help?`,
    },
  ],
  ar: [
    {
      patterns: [/تسجيل/i, /أسجل/i],
      answer: `**للتسجيل:**\n📞 822898-632-212+\n✉️ contact@ipisb.ma`,
    },
    {
      patterns: [/مرحبا/i, /أهلا/i],
      answer: `مرحباً! أنا **آية**، مستشارتك في IPISB 🎓`,
    },
  ],
  darija: [
    {
      patterns: [/sejjel/i, /inscription/i],
      answer: `**Kifach tsejjel:**\n📞 822898-632+212\n✉️ contact@ipisb.ma`,
    },
    {
      patterns: [/mrhba/i, /salam/i, /bonjour/i],
      answer: `Mrhba bik! Ana **Aya**, l-mstashara dyalkom f IPISB 🎓`,
    },
  ],
};

const DEFAULT_FALLBACK: Record<Lang, string> = {
  fr:     `Je suis **Aya**, votre conseillère IPISB 🎓\n📞 +212 632-822898 — contact@ipisb.ma`,
  en:     `I'm **Aya**, your IPISB advisor 🎓\n📞 +212 632-822898 — contact@ipisb.ma`,
  ar:     `أنا **آية**، مستشارتك في IPISB 🎓\n📞 822898-632-212+`,
  darija: `Ana **Aya**, mstashara dyalkom f IPISB 🎓\n📞 822898-632+212`,
};

function localFallback(text: string, lang: Lang): string {
  for (const entry of LOCAL_KB[lang]) {
    if (entry.patterns.some(p => p.test(text))) return entry.answer;
  }
  return DEFAULT_FALLBACK[lang];
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const CW_CSS = `
.cw{--teal:${D.teal};--teal2:${D.teal2};--mint:${D.mint};--ink:${D.ink};--line:${D.border};--soft:${D.card2}}
.cw *{box-sizing:border-box}
@keyframes cw-in{from{opacity:0;transform:translateY(24px) scale(.94)}to{opacity:1;transform:none}}
@keyframes cw-up{from{opacity:0;transform:translateY(14px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@keyframes cw-rot{to{--cwa:360deg}}
@property --cwa{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes cw-morph{0%,100%{border-radius:42% 58% 63% 37%/41% 44% 56% 59%;transform:rotate(0) scale(1)}33%{border-radius:63% 37% 38% 62%/55% 61% 39% 45%;transform:rotate(120deg) scale(1.05)}66%{border-radius:37% 63% 51% 49%/37% 35% 65% 63%;transform:rotate(240deg) scale(.96)}}
@keyframes cw-breathe{50%{transform:scale(1.15);opacity:.7}}
@keyframes cw-spin{to{transform:rotate(360deg)}}
@keyframes cw-ping{0%{box-shadow:0 0 0 0 rgba(47,212,122,.6)}70%,100%{box-shadow:0 0 0 7px rgba(47,212,122,0)}}
@keyframes cw-tp{0%,60%,100%{transform:none;opacity:.4}30%{transform:translateY(-5px);opacity:1}}
@keyframes cw-shine{to{background-position:250% center}}
.cw-panel{animation:cw-in .5s cubic-bezier(.22,1,.36,1)}
.cw-av{position:relative;flex:none;border-radius:50%}
.cw-av::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from var(--cwa),#5fe3c4,#3fa9ff,#7b6cff,#5fe3c4);animation:cw-rot 3s linear infinite}
.cw-av img{position:absolute;inset:2.5px;width:calc(100% - 5px);height:calc(100% - 5px);border-radius:50%;object-fit:cover;background:#fff}
.cw-av.on::after{content:"";position:absolute;bottom:0;right:0;width:28%;height:28%;border-radius:50%;background:#2fd47a;border:2px solid #fff}
.cw-orb{position:relative;width:96px;height:96px;margin:6px auto 18px}
.cw-orb i{position:absolute;inset:0;border-radius:50%;mix-blend-mode:multiply;animation:cw-morph 8s ease-in-out infinite}
.cw-orb i:nth-child(1){background:radial-gradient(circle at 30% 30%,#9ff0db,#12b5a2);animation-duration:7s}
.cw-orb i:nth-child(2){background:radial-gradient(circle at 70% 40%,#bfe2ff,#3fa9ff);opacity:.7;animation-duration:9s;animation-direction:reverse}
.cw-orb i:nth-child(3){background:radial-gradient(circle at 50% 80%,#d8d3ff,#7b6cff);opacity:.55;animation-duration:11s}
.cw-orb b{position:absolute;inset:14% 22% 50% 18%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,255,255,.85),transparent 70%);filter:blur(3px)}
.cw-orb s{position:absolute;inset:-14px;border-radius:50%;border:1.5px dashed rgba(11,138,125,.25);animation:cw-spin 30s linear infinite}
.cw-orb u{position:absolute;inset:-30%;border-radius:50%;background:radial-gradient(circle,rgba(95,227,196,.45),transparent 60%);filter:blur(14px);z-index:-1;animation:cw-breathe 4s ease-in-out infinite}
.cw.thinking .cw-orb i{animation-duration:2.2s!important}
.cw-grad{background:linear-gradient(100deg,#0b8a7d,#12b5a2 25%,#3fa9ff 55%,#7b6cff 75%,#0b8a7d);background-size:250% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:cw-shine 7s linear infinite}
.cw-up{opacity:0;animation:cw-up .7s cubic-bezier(.22,1,.36,1) forwards}
.cw-msg{animation:cw-up .5s cubic-bezier(.22,1,.36,1) both}
.cw-sg{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border-radius:16px;background:#fff;border:1px solid var(--line);text-align:start;font:600 13px ${sans};color:var(--ink);cursor:pointer;transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .45s,border-color .3s}
.cw-sg:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px rgba(11,138,125,.55);border-color:rgba(11,138,125,.35)}
.cw-sg span.i{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;flex:none;color:#fff;background:linear-gradient(135deg,#0b8a7d,#12b5a2);transition:transform .5s cubic-bezier(.22,1,.36,1)}
.cw-sg:nth-child(2) span.i{background:linear-gradient(135deg,#3fa9ff,#7cc4ff)}
.cw-sg:nth-child(3) span.i{background:linear-gradient(135deg,#7b6cff,#a89eff)}
.cw-sg:hover span.i{transform:rotate(-10deg) scale(1.08)}
.cw-lang{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px;border-radius:18px;background:#fff;border:1px solid var(--line);cursor:pointer;transition:transform .45s cubic-bezier(.22,1,.36,1),box-shadow .45s,border-color .3s}
.cw-lang:hover{transform:translateY(-4px);border-color:rgba(11,138,125,.4);box-shadow:0 20px 40px -24px rgba(11,138,125,.6)}
.cw-box{position:relative;border-radius:22px;background:#fff;border:1px solid rgba(6,32,29,.16);box-shadow:0 14px 34px -22px rgba(6,32,29,.4);transition:box-shadow .4s}
.cw-box::before{content:"";position:absolute;inset:-2px;border-radius:24px;padding:2px;background:conic-gradient(from var(--cwa),transparent 50%,#0b8a7d,#5fe3c4,#3fa9ff,transparent 90%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .4s;animation:cw-rot 3s linear infinite;pointer-events:none}
.cw-box:focus-within::before{opacity:1}
.cw-send{transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .3s}
.cw-send:not(:disabled):hover{transform:translateY(-2px) rotate(-8deg)}
.cw-fab{transition:transform .5s cubic-bezier(.22,1,.36,1)}
.cw-fab:hover{transform:translateY(-3px)}
.cw-fab::before{content:"";position:absolute;inset:-2px;border-radius:999px;padding:2px;background:conic-gradient(from var(--cwa),transparent 55%,#0b8a7d,#5fe3c4,transparent 85%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:cw-rot 2.6s linear infinite}
.cw-focus:focus-visible{outline:2px solid #12b5a2;outline-offset:2px}
.cw-log::-webkit-scrollbar{width:6px}.cw-log::-webkit-scrollbar-thumb{background:rgba(6,32,29,.12);border-radius:6px}
@media (prefers-reduced-motion: reduce){.cw *,.cw *::before,.cw *::after,.cw-fab::before{animation:none!important;transition:none!important}}
`;

function AyaAvatar({ size, online }: { size: number; online?: boolean }) {
  return (
    <span className={`cw-av${online ? " on" : ""}`} style={{ width: size, height: size }}>
      <img src="/aya-avatar.png" alt="Aya" />
    </span>
  );
}

function Orb() {
  return <div className="cw-orb" aria-hidden="true"><u /><s /><i /><i /><i /><b /></div>;
}

function LangPicker({ onSelect }: { onSelect: (l: Lang) => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "22px 20px", gap: 6 }}>
      <div className="cw-up"><Orb /></div>
      <div className="cw-up" style={{ animationDelay: ".08s", textAlign: "center", fontFamily: sans }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.03em", color: D.ink, lineHeight: 1.15 }}>
          Bonjour, je suis <span className="cw-grad">Aya</span>
        </div>
        <div style={{ fontSize: 13, color: D.muted, marginTop: 8 }}>Choisissez votre langue · Choose your language · اختر لغتك</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginTop: 18 }}>
        {LANGS.map((l, i) => (
          <button
            key={l.code}
            autoFocus={i === 0}
            onClick={() => onSelect(l.code)}
            aria-label={`${l.label} — ${l.sub}`}
            className="cw-lang cw-focus cw-up"
            style={{ animationDelay: `${.16 + i * .07}s` }}
          >
            <span style={{ fontSize: 24 }}>{l.flag}</span>
            <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 800, color: D.ink, direction: l.rtl ? "rtl" : "ltr" }}>{l.label}</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: D.muted, direction: l.rtl ? "rtl" : "ltr" }}>{l.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg, rtl }: { msg: Msg; rtl: boolean; isWelcome?: boolean }) {
  const isBot = msg.role === "assistant";
  return (
    <div className="cw-msg" style={{
      display: "flex", flexDirection: isBot ? "row" : "row-reverse",
      marginBottom: 14, alignItems: "flex-start", gap: 9,
    }}>
      {isBot && <AyaAvatar size={30} />}
      <div style={{
        maxWidth: "80%",
        background: isBot ? "#fff" : D.ink,
        border: isBot ? `1px solid ${D.border}` : "none",
        borderRadius: isBot ? "6px 20px 20px 20px" : "20px 6px 20px 20px",
        fontFamily: sans, fontSize: 13.5, lineHeight: 1.6,
        color: isBot ? D.ink : "#fff",
        boxShadow: isBot ? "0 10px 26px -20px rgba(6,32,29,.45)" : "0 12px 26px -16px rgba(6,32,29,.6)",
        direction: rtl ? "rtl" : "ltr",
        textAlign: rtl ? "right" : "left",
        padding: "10px 15px",
        overflowWrap: "break-word",
        whiteSpace: isBot ? "normal" : "pre-wrap",
      }}>
        {isBot
          ? <span className="cw-md" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
          : msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="cw-msg" style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 14 }}>
      <AyaAvatar size={30} />
      <div style={{
        background: "#fff", border: `1px solid ${D.border}`,
        borderRadius: "6px 20px 20px 20px", padding: "14px 18px",
        display: "flex", gap: 5, alignItems: "center",
      }}>
        {[D.teal, "#3fa9ff", "#7b6cff"].map((c, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: 999, background: c, display: "inline-block",
            animation: `cw-tp 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Review summary card ───────────────────────────────────────────────────────
function ReviewCard({
  slots,
  onConfirm,
  onCorrect,
}: {
  slots:     Record<string, string>;
  onConfirm: () => void;
  onCorrect: () => void;
}) {
  const slotLabels: Record<string, string> = {
    nom:        "Nom complet",
    telephone:  "Téléphone",
    email:      "Email",
    filiere:    "Filière souhaitée",
    niveau_bac: "Niveau Bac",
    ville:      "Ville",
  };

  return (
    <div className="cw-msg" style={{
      background: `linear-gradient(140deg, ${D.ink}, #0d3a35)`,
      borderRadius: 20, padding: 16, marginBottom: 14, marginInlineStart: 39,
      fontFamily: sans, fontSize: 12.5, color: "#fff",
      boxShadow: "0 20px 40px -24px rgba(6,32,29,.7)",
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: D.mint, marginBottom: 12 }}>
        Récapitulatif de votre dossier
      </div>
      <div style={{ marginBottom: 12, display: "grid", gap: 6 }}>
        {Object.entries(slotLabels).map(([key, label]) =>
          slots[key] ? (
            <div key={key} style={{ display: "flex", gap: 8, padding: "7px 10px", borderRadius: 10, background: "rgba(255,255,255,.07)" }}>
              <span style={{ color: "#a8c2bd", minWidth: 110 }}>{label}</span>
              <span style={{ fontWeight: 700 }}>{slots[key]}</span>
            </div>
          ) : null
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onConfirm} className="cw-focus cw-send" style={{
          flex: 1, background: D.mint, border: "none", borderRadius: 12, padding: "10px 12px",
          cursor: "pointer", fontFamily: sans, fontSize: 13, fontWeight: 800, color: D.ink,
        }}>Confirmer ✓</button>
        <button onClick={onCorrect} className="cw-focus cw-send" style={{
          flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,.3)", borderRadius: 12,
          padding: "10px 12px", cursor: "pointer", fontFamily: sans, fontSize: 13, fontWeight: 700, color: "#fff",
        }}>Corriger ✗</button>
      </div>
    </div>
  );
}

// ── Progress bar in header ────────────────────────────────────────────────────
function StageProgress({ stage }: { stage: Stage }) {
  const label = STAGE_LABELS[stage];
  if (!label) return null;
  const stepMap: Record<Stage, number> = { chat: 0, collect_info: 1, review: 2, confirmed: 3 };
  const step  = stepMap[stage] ?? 0;
  const total = 3;
  const pct   = (step / total) * 100;
  return (
    <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, color: stage === "confirmed" ? D.green : D.teal }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: D.muted }}>{step}/{total}</span>
      </div>
      <div role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={total} aria-label={label}
        style={{ height: 5, background: D.card2, borderRadius: 999, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 999, transition: "width .6s cubic-bezier(.22,1,.36,1)",
          background: stage === "confirmed" ? D.green : `linear-gradient(90deg, ${D.teal}, ${D.mint})`,
        }} />
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
const FAB_LABEL: Record<string, string> = {
  fr: "Besoin d'aide ? Demandez à Aya",
  en: "Need help? Ask Aya",
  ar: "تحتاج مساعدة؟ اسأل آية",
};

export function ChatWidget() {
  const { lang: siteLang } = useI18n();
  const { isMobile } = useBreakpoint();
  const [open,      setOpen]      = useState(false);
  const [lang,      setLang]      = useState<Lang | null>(null);
  const [messages,  setMessages]  = useState<Msg[]>([]);
  const [input,     setInput]     = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread,    setUnread]    = useState(0);

  // Registration flow state
  const [stage,     setStage]     = useState<Stage>("chat");
  const [slots,     setSlots]     = useState<Record<string, string>>({});
  const [docs,      setDocs]      = useState<Record<string, DocInfo>>({});
  const [sessionId, setSessionId] = useState<string>("");

  // Whether the review card has already been shown for the current review stage
  const [reviewShown, setReviewShown] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const rtl = lang === "ar" || lang === "darija";

  // ── Session persistence via localStorage + backend restore ─────────────────
  useEffect(() => {
    const storedId = localStorage.getItem("ipisb_session_id");
    if (storedId) {
      setSessionId(storedId);
      // Restore registration state (stage / slots / docs) from the backend.
      // Fails silently if the backend is down or the session is unknown.
      fetch(`${API}/api/chat/session/${encodeURIComponent(storedId)}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (!data) return;
          if (data.stage) setStage(data.stage as Stage);
          if (data.slots && typeof data.slots === "object") setSlots(data.slots);
          if (data.docs  && typeof data.docs  === "object") setDocs(data.docs);
        })
        .catch(() => { /* backend unavailable — start fresh */ });
    } else {
      const newId = generateSessionId();
      localStorage.setItem("ipisb_session_id", newId);
      setSessionId(newId);
    }
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Keep the welcome screen (orb + greeting) in view; follow the thread after that
    if (messages.length <= 1) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, streaming, reviewShown]);

  // ── Focus on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      if (lang) setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, lang]);

  // ── Reset review card shown when stage changes ──────────────────────────────
  useEffect(() => {
    if (stage !== "review") setReviewShown(false);
  }, [stage]);

  function handleLangSelect(l: Lang) {
    setLang(l);
    setMessages([{ role: "assistant", content: WELCOME[l] }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ── Shared SSE streaming core ───────────────────────────────────────────────
  // Posts `history` to /api/chat/stream and streams the reply into the last
  // (empty) assistant message. Handles the leading meta chunk per protocol:
  //   data: {"meta": {stage, slots, docs, session_id}}  then  data: {"text": "…"}
  async function streamChat(history: Msg[]) {
    const res = await fetch(`${API}/api/chat/stream`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        messages:   history.map(m => ({ role: m.role, content: m.content })),
        session_id: sessionId,
        language:   lang ?? "fr",
        stage,
        slots,
        docs,
      }),
    });

    if (!res.ok || !res.body) throw new Error(`Failed: ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full   = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          await reader.cancel().catch(() => {});
          return;
        }
        try {
          const parsed = JSON.parse(payload);

          // Meta chunk — update registration state
          if (parsed.meta) {
            const m = parsed.meta;
            if (m.stage)      setStage(m.stage as Stage);
            if (m.slots)      setSlots(m.slots);
            if (m.docs)       setDocs(m.docs);
            if (m.session_id) {
              setSessionId(m.session_id);
              localStorage.setItem("ipisb_session_id", m.session_id);
            }
            continue;
          }

          // Text chunk — stream into the last bot message
          if (parsed.text) {
            full += parsed.text;
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = { role: "assistant", content: full };
              return next;
            });
          }
        } catch { /* ignore parse errors */ }
      }
    }
  }

  // ── Core send function ──────────────────────────────────────────────────────
  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || streaming || !lang) return;
    setInput("");
    // Reset the auto-grown textarea back to a single line
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Msg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      await streamChat(history);
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      console.error("Chat error:", err);
      const fallback = localFallback(text, lang);
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: fallback };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  // ── Review card actions ─────────────────────────────────────────────────────
  function handleConfirm() {
    setReviewShown(true);
    send("Confirmer");
  }

  function handleCorrect() {
    setReviewShown(true);
    setStage("collect_info");
    send("Je veux corriger mes informations");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // ── Open from anywhere: window.dispatchEvent(new CustomEvent("aya:open")) ──
  useEffect(() => {
    const fn = () => setOpen(true);
    window.addEventListener("aya:open", fn);
    return () => window.removeEventListener("aya:open", fn);
  }, []);

  // ── Escape closes the widget ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const showReviewCard =
    stage === "review" &&
    !reviewShown &&
    !streaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant";


  const isWelcome = messages.length <= 1 && stage === "chat";
  const HELLO: Record<Lang, [string, string]> = {
    fr: ["Comment puis-je ", "vous aider ?"], en: ["How can I ", "help you?"],
    ar: ["كيف يمكنني ", "مساعدتك؟"], darija: ["Kifach nqder ", "n3awnek?"],
  };
  const SUG_ICONS = [
    <svg key="a" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></svg>,
    <svg key="b" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
    <svg key="c" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>,
  ];

  return (
    <div className={`cw${streaming ? " thinking" : ""}`}>
      <style>{CW_CSS}</style>

      {open && (
        <div
          role="dialog"
          aria-label="Chat avec Aya — Conseillère IPISB"
          className="cw-panel"
          style={{
            position: "fixed", zIndex: 1000,
            ...(isMobile
              ? { left: 8, right: 8, bottom: 84, top: 12, width: "auto", height: "auto" }
              : { bottom: 92, right: 24, width: 400, height: 640, maxHeight: "calc(100vh - 116px)" }),
            background: `radial-gradient(420px 240px at 100% 0%, ${D.mintSoft}, transparent 70%), radial-gradient(360px 260px at 0% 100%, #eaf3ff, transparent 70%), #fff`,
            border: `1px solid ${D.border}`,
            borderRadius: 28,
            display: "flex", flexDirection: "column",
            boxShadow: "0 40px 100px -30px rgba(6,32,29,.45), 0 12px 30px -18px rgba(11,138,125,.35)",
            overflow: "hidden",
          }}>

          {/* Header */}
          <div style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <AyaAvatar size={44} online />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: sans, fontSize: 15.5, fontWeight: 800, color: D.ink }}>Aya · IPISB</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "#2fd47a", display: "inline-block", animation: "cw-ping 1.6s infinite" }} />
                  <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: D.teal }}>
                    {streaming ? "Aya écrit…" : "Conseillère IPISB · En ligne"}
                  </span>
                </div>
              </div>

              {lang && (
                <button
                  onClick={() => { setLang(null); setMessages([]); setStage("chat"); setSlots({}); setDocs({}); }}
                  title="Changer de langue"
                  aria-label="Changer de langue"
                  className="cw-focus"
                  style={{
                    background: D.card2, border: `1px solid ${D.border}`, borderRadius: 12,
                    padding: "6px 10px", cursor: "pointer", color: D.muted, fontFamily: sans, fontSize: 13,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {LANGS.find(l => l.code === lang)?.flag}
                  <ChevronDown size={12} color={D.muted} />
                </button>
              )}

              <button onClick={() => setOpen(false)} aria-label="Fermer le chat" className="cw-focus" style={{
                background: D.card2, border: 0, cursor: "pointer", color: D.ink,
                width: 34, height: 34, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={16} strokeWidth={2.2} /></button>
            </div>
            {lang && <StageProgress stage={stage} />}
          </div>

          {/* Body */}
          {!lang ? (
            <LangPicker onSelect={handleLangSelect} />
          ) : (
            <>
              <div
                role="log"
                aria-live="polite"
                aria-busy={streaming}
                aria-label="Messages"
                className="cw-log"
                style={{ flex: 1, overflowY: "auto", padding: "16px 14px", scrollbarWidth: "thin" }}
              >
                {isWelcome && (
                  <div style={{ textAlign: "center", padding: "6px 0 16px", direction: rtl ? "rtl" : "ltr" }}>
                    <div className="cw-up"><Orb /></div>
                    <div className="cw-up" style={{ animationDelay: ".08s", fontFamily: sans, fontSize: 22, fontWeight: 800, letterSpacing: "-.03em", color: D.ink, lineHeight: 1.2 }}>
                      {HELLO[lang][0]}<span className="cw-grad">{HELLO[lang][1]}</span>
                    </div>
                  </div>
                )}

                {messages.map((m, i) => (
                  <Bubble key={i} msg={m} rtl={rtl} isWelcome={i === 0} />
                ))}

                {streaming && messages[messages.length - 1]?.content === "" && <TypingIndicator />}

                {showReviewCard && (
                  <ReviewCard slots={slots} onConfirm={handleConfirm} onCorrect={handleCorrect} />
                )}

                {isWelcome && (
                  <div style={{ display: "grid", gap: 8, marginTop: 4, direction: rtl ? "rtl" : "ltr" }}>
                    {SUGGESTIONS[lang].map((s, i) => (
                      <button key={s} onClick={() => send(s)} className="cw-sg cw-focus cw-up" style={{ animationDelay: `${.25 + i * .08}s` }}>
                        <span className="i">{SUG_ICONS[i % 3]}</span>
                        <span style={{ flex: 1 }}>{s}</span>
                        <span style={{ color: D.muted, transform: rtl ? "scaleX(-1)" : undefined }}>→</span>
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {(stage !== "review" || reviewShown) && (
                <div style={{ padding: "10px 12px 12px", flexShrink: 0 }}>
                  <div className="cw-box" style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "6px 6px 6px 14px" }}>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
                      }}
                      onKeyDown={handleKey}
                      placeholder={PLACEHOLDER[lang]}
                      aria-label={PLACEHOLDER[lang]}
                      rows={1}
                      dir={rtl ? "rtl" : "ltr"}
                      style={{
                        flex: 1, background: "transparent", border: 0, padding: "9px 0",
                        color: D.ink, fontFamily: sans, fontSize: 14,
                        resize: "none", outline: "none", lineHeight: 1.45, maxHeight: 110, overflowY: "auto",
                        textAlign: rtl ? "right" : "left",
                      }}
                    />
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || streaming}
                      aria-label="Envoyer le message"
                      className="cw-focus cw-send"
                      style={{
                        width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, ${D.teal}, ${D.teal2})`,
                        boxShadow: "0 10px 22px -10px rgba(11,138,125,.7)",
                        opacity: input.trim() && !streaming ? 1 : .35,
                        border: 0, cursor: input.trim() && !streaming ? "pointer" : "default",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    ><Send size={16} strokeWidth={2.2} style={{ transform: rtl ? "scaleX(-1)" : undefined }} /></button>
                  </div>
                  <div style={{ textAlign: "center", fontFamily: sans, fontSize: 10.5, color: D.muted, marginTop: 7 }}>
                    Aya peut se tromper — vérifiez les informations importantes auprès de l'administration.
                  </div>
                </div>
              )}

              {stage === "review" && !reviewShown && (
                <div style={{
                  padding: "10px 14px", borderTop: `1px solid ${D.border}`, flexShrink: 0,
                  fontFamily: sans, fontSize: 11.5, color: D.muted, textAlign: "center",
                }}>
                  Vérifiez vos informations et cliquez sur Confirmer ou Corriger
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open
          ? "Fermer le chat"
          : `Ouvrir le chat avec Aya${unread > 0 ? ` — ${unread} message(s) non lu(s)` : ""}`}
        aria-expanded={open}
        className="cw-focus cw-fab"
        title="Chat avec Aya — Conseillère IPISB"
        style={{
          position: "fixed", bottom: 22, right: 22, zIndex: open ? 1000 : 50,
          display: "flex", alignItems: "center", gap: 10,
          padding: open || isMobile ? 6 : "6px 18px 6px 6px",
          borderRadius: 999, border: `1px solid ${D.border}`, cursor: "pointer",
          background: "#fff", color: D.ink,
          boxShadow: "0 20px 50px -15px rgba(6,32,29,.4)",
          fontFamily: sans, fontSize: 13.5, fontWeight: 700,
        }}
      >
        {open
          ? <span style={{ width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center", background: D.ink, color: "#fff" }}><X size={20} strokeWidth={2} /></span>
          : <AyaAvatar size={44} online />}
        {!open && !isMobile && <span>{FAB_LABEL[siteLang] ?? FAB_LABEL.fr}</span>}
        {unread > 0 && !open && (
          <span aria-hidden="true" style={{
            position: "absolute", top: -4, right: -4,
            width: 20, height: 20, borderRadius: 999,
            background: D.red, color: "#fff",
            fontSize: 10.5, fontWeight: 700, fontFamily: mono,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{unread}</span>
        )}
      </button>
    </div>
  );
}
