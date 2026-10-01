import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  History,
  House,
  KeyRound,
  LogOut,
  Menu,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Wifi,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import rioCardLogo from "@/assets/riocard-marca.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planejador de passagens — RioCard Mais" },
      {
        name: "description",
        content:
          "Calcule quantos dias de curso seu saldo cobre e descubra a data da próxima recarga.",
      },
      {
        property: "og:title",
        content: "Planejador de passagens — RioCard Mais",
      },
      {
        property: "og:description",
        content:
          "Organize seu saldo, seus dias de curso e a próxima recarga em um calendário simples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const STORAGE_KEY = "riocard-planner";
const API_BASE = "/api";

const CARD_THEMES = {
  azul: {
    name: "Azul",
    from: "#0f8cff",
    via: "#0080ff",
    to: "#0069e8",
    glow: "rgba(0, 121, 250, 0.35)",
    decoration: null,
  },
  rosa: {
    name: "Rosa",
    from: "#ff5db1",
    via: "#ff2a8e",
    to: "#d8006d",
    glow: "rgba(255, 0, 140, 0.35)",
    decoration: null,
  },
  verde: {
    name: "Verde",
    from: "#27c77d",
    via: "#1ead6c",
    to: "#0f8f53",
    glow: "rgba(22, 163, 74, 0.35)",
    decoration: null,
  },
  roxo: {
    name: "Roxo",
    from: "#8b5cf6",
    via: "#7c3aed",
    to: "#5b2ecf",
    glow: "rgba(124, 58, 237, 0.35)",
    decoration: null,
  },
  laranja: {
    name: "Laranja",
    from: "#ff9f43",
    via: "#ff8a3d",
    to: "#e66a00",
    glow: "rgba(234, 88, 12, 0.35)",
    decoration: null,
  },
  cinza: {
    name: "Cinza",
    from: "#667085",
    via: "#475467",
    to: "#344054",
    glow: "rgba(71, 84, 103, 0.35)",
    decoration: null,
  },
  natal: {
    name: "Natal",
    from: "#168653",
    via: "#0f6844",
    to: "#0b4938",
    glow: "rgba(22, 101, 52, 0.4)",
    decoration: "natal",
  },
  carnaval: {
    name: "Carnaval",
    from: "#7c3aed",
    via: "#c026d3",
    to: "#db2777",
    glow: "rgba(192, 38, 211, 0.4)",
    decoration: "carnaval",
  },
  praia: {
    name: "Praia",
    from: "#0e9aa7",
    via: "#087eaa",
    to: "#075985",
    glow: "rgba(14, 116, 144, 0.4)",
    decoration: "praia",
  },
  espaco: {
    name: "Espaço",
    from: "#4c1d95",
    via: "#312e81",
    to: "#111827",
    glow: "rgba(76, 29, 149, 0.45)",
    decoration: "espaco",
  },
  outono: {
    name: "Outono",
    from: "#c2410c",
    via: "#9a3412",
    to: "#431407",
    glow: "rgba(194, 65, 12, 0.4)",
    decoration: "outono",
  },
  flores: {
    name: "Flores",
    from: "#ec4899",
    via: "#be185d",
    to: "#831843",
    glow: "rgba(236, 72, 153, 0.4)",
    decoration: "flores",
  },
  montanha: {
    name: "Montanha",
    from: "#64748b",
    via: "#475569",
    to: "#1e293b",
    glow: "rgba(100, 116, 139, 0.4)",
    decoration: "montanha",
  },
  floresta: {
    name: "Floresta",
    from: "#22c55e",
    via: "#15803d",
    to: "#14532d",
    glow: "rgba(34, 197, 94, 0.35)",
    decoration: "floresta",
  },
  oceano: {
    name: "Oceano",
    from: "#06b6d4",
    via: "#0e7490",
    to: "#164e63",
    glow: "rgba(6, 182, 212, 0.4)",
    decoration: "oceano",
  },
  aurora: {
    name: "Aurora",
    from: "#34d399",
    via: "#0f766e",
    to: "#312e81",
    glow: "rgba(52, 211, 153, 0.4)",
    decoration: "aurora",
  },
  galaxia: {
    name: "Galáxia",
    from: "#a855f7",
    via: "#6d28d9",
    to: "#1e1b4b",
    glow: "rgba(168, 85, 247, 0.4)",
    decoration: "galaxia",
  },
  neon: {
    name: "Neon",
    from: "#22d3ee",
    via: "#7c3aed",
    to: "#db2777",
    glow: "rgba(34, 211, 238, 0.4)",
    decoration: "neon",
  },
  arcade: {
    name: "Arcade",
    from: "#4f46e5",
    via: "#7e22ce",
    to: "#111827",
    glow: "rgba(79, 70, 229, 0.4)",
    decoration: "arcade",
  },
  musica: {
    name: "Música",
    from: "#f472b6",
    via: "#9333ea",
    to: "#4c1d95",
    glow: "rgba(147, 51, 234, 0.4)",
    decoration: "musica",
  },
  futebol: {
    name: "Futebol",
    from: "#22c55e",
    via: "#16a34a",
    to: "#14532d",
    glow: "rgba(22, 163, 74, 0.4)",
    decoration: "futebol",
  },
  basquete: {
    name: "Basquete",
    from: "#fb923c",
    via: "#ea580c",
    to: "#7c2d12",
    glow: "rgba(234, 88, 12, 0.4)",
    decoration: "basquete",
  },
  corrida: {
    name: "Corrida",
    from: "#facc15",
    via: "#f97316",
    to: "#be123c",
    glow: "rgba(249, 115, 22, 0.4)",
    decoration: "corrida",
  },
  pets: {
    name: "Pets",
    from: "#c084fc",
    via: "#8b5cf6",
    to: "#4c1d95",
    glow: "rgba(139, 92, 246, 0.4)",
    decoration: "pets",
  },
  cafe: {
    name: "Café",
    from: "#a16207",
    via: "#78350f",
    to: "#451a03",
    glow: "rgba(161, 98, 7, 0.4)",
    decoration: "cafe",
  },
  doces: {
    name: "Doces",
    from: "#f9a8d4",
    via: "#ec4899",
    to: "#9333ea",
    glow: "rgba(236, 72, 153, 0.4)",
    decoration: "doces",
  },
  frutas: {
    name: "Frutas",
    from: "#facc15",
    via: "#84cc16",
    to: "#15803d",
    glow: "rgba(132, 204, 22, 0.4)",
    decoration: "frutas",
  },
  borboletas: {
    name: "Borboletas",
    from: "#c084fc",
    via: "#7c3aed",
    to: "#2563eb",
    glow: "rgba(124, 58, 237, 0.4)",
    decoration: "borboletas",
  },
  ceu: {
    name: "Céu estrelado",
    from: "#60a5fa",
    via: "#2563eb",
    to: "#172554",
    glow: "rgba(37, 99, 235, 0.4)",
    decoration: "ceu",
  },
  geometrico: {
    name: "Geométrico",
    from: "#14b8a6",
    via: "#4f46e5",
    to: "#312e81",
    glow: "rgba(79, 70, 229, 0.4)",
    decoration: "geometrico",
  },
} as const;

type CardDecorationKey =
  | "natal"
  | "carnaval"
  | "praia"
  | "espaco"
  | "outono"
  | "flores"
  | "montanha"
  | "floresta"
  | "oceano"
  | "aurora"
  | "galaxia"
  | "neon"
  | "arcade"
  | "musica"
  | "futebol"
  | "basquete"
  | "corrida"
  | "pets"
  | "cafe"
  | "doces"
  | "frutas"
  | "borboletas"
  | "ceu"
  | "geometrico";
type CardColorKey = keyof typeof CARD_THEMES;
const CARD_THEME_DESCRIPTIONS: Record<CardColorKey, string> = {
  azul: "Azul vibrante para um visual clássico.",
  rosa: "Degradê rosa marcante e moderno.",
  verde: "Tons verdes frescos e naturais.",
  roxo: "Roxo intenso com acabamento elegante.",
  laranja: "Laranja quente, energético e luminoso.",
  cinza: "Cinza urbano com visual discreto.",
  natal: "Árvore iluminada e detalhes festivos.",
  carnaval: "Máscara colorida e brilho de festa.",
  praia: "Sol dourado e ondas em clima tropical.",
  espaco: "Planeta e estrelas em um céu profundo.",
  outono: "Folhas quentes e tons aconchegantes.",
  flores: "Flores delicadas em um jardim vibrante.",
  montanha: "Picos de montanha e ar de aventura.",
  floresta: "Folhagens e natureza em tons verdes.",
  oceano: "Vida marinha em águas profundas.",
  aurora: "Faixas de luz inspiradas na aurora boreal.",
  galaxia: "Nebulosas e estrelas distantes.",
  neon: "Brilho neon com energia futurista.",
  arcade: "Clima retrô de fliperama e pixels.",
  musica: "Notas musicais para levar o ritmo junto.",
  futebol: "Tema de futebol com bola e gramado.",
  basquete: "Bola e energia das quadras.",
  corrida: "Velocidade, bandeirada e movimento.",
  pets: "Patinhas e carinho pelos animais.",
  cafe: "Tons de café para uma pausa tranquila.",
  doces: "Doces coloridos em tons açucarados.",
  frutas: "Frutas frescas e cores tropicais.",
  borboletas: "Borboletas leves em voo.",
  ceu: "Lua e estrelas sob o céu noturno.",
  geometrico: "Formas geométricas contemporâneas.",
};

const CARD_DECORATION_SYMBOLS: Record<CardDecorationKey, string> = {
  natal: "❄",
  carnaval: "✦",
  praia: "☀",
  espaco: "✦",
  outono: "🍂",
  flores: "🌸",
  montanha: "⛰",
  floresta: "🌿",
  oceano: "🐚",
  aurora: "🌌",
  galaxia: "🌠",
  neon: "💠",
  arcade: "👾",
  musica: "♫",
  futebol: "⚽",
  basquete: "🏀",
  corrida: "🏁",
  pets: "🐾",
  cafe: "☕",
  doces: "🍭",
  frutas: "🍊",
  borboletas: "🦋",
  ceu: "✨",
  geometrico: "◈",
};
const LEGACY_CARD_THEME_MAP: Record<string, CardColorKey> = {
  vermelho: "natal",
  turquesa: "praia",
  dourado: "carnaval",
  grafite: "espaco",
};

const APP_THEMES = {
  oceano: {
    name: "Oceano",
    description: "Azul limpo com detalhes turquesa",
    primary: "#0877e8",
    soft: "#e8f2ff",
    accent: "#13b8a6",
    background: "#f3f7fc",
    from: "#0877e8",
    to: "#0754b8",
  },
  floresta: {
    name: "Floresta",
    description: "Verde natural e equilibrado",
    primary: "#16834a",
    soft: "#e8f7ee",
    accent: "#b2d957",
    background: "#f3f8f3",
    from: "#16834a",
    to: "#075c35",
  },
  coral: {
    name: "Coral",
    description: "Coral vibrante com toque pêssego",
    primary: "#e65355",
    soft: "#fff0ec",
    accent: "#ffad75",
    background: "#fff8f5",
    from: "#e65355",
    to: "#b83252",
  },
  violeta: {
    name: "Violeta",
    description: "Roxo moderno e sofisticado",
    primary: "#7544d6",
    soft: "#f1ecff",
    accent: "#cf84ed",
    background: "#f8f6ff",
    from: "#7544d6",
    to: "#4f2a9f",
  },
  rosa: {
    name: "Rosa",
    description: "Rosa alegre com contraste elegante",
    primary: "#d93683",
    soft: "#ffedf5",
    accent: "#ff9aaf",
    background: "#fff7fa",
    from: "#d93683",
    to: "#a61c63",
  },
  grafite: {
    name: "Grafite",
    description: "Visual escuro, discreto e urbano",
    primary: "#475569",
    soft: "#e9eef5",
    accent: "#38bdf8",
    background: "#f3f5f8",
    from: "#475569",
    to: "#1e293b",
  },
  ambar: {
    name: "Âmbar",
    description: "Dourado acolhedor e luminoso",
    primary: "#b66a08",
    soft: "#fff4d9",
    accent: "#ef9b31",
    background: "#fffaf0",
    from: "#d88712",
    to: "#98520a",
  },
  turquesa: {
    name: "Turquesa",
    description: "Frescor tropical em azul-esverdeado",
    primary: "#07858c",
    soft: "#e4f8f7",
    accent: "#43c8b5",
    background: "#f1fbfa",
    from: "#07858c",
    to: "#075e70",
  },
  lavanda: {
    name: "Lavanda",
    description: "Lavanda suave com azul profundo",
    primary: "#6655b8",
    soft: "#f0efff",
    accent: "#8d9cf5",
    background: "#f8f8ff",
    from: "#6655b8",
    to: "#41377f",
  },
  rubi: {
    name: "Rubi",
    description: "Vermelho marcante com tons quentes",
    primary: "#bc334a",
    soft: "#ffedf0",
    accent: "#f08a58",
    background: "#fff7f6",
    from: "#bc334a",
    to: "#7f213d",
  },
} as const;

type AppThemeKey = keyof typeof APP_THEMES;
type AppPage =
  | "home"
  | "profile"
  | "calendar"
  | "history"
  | "account-data"
  | "accessibility"
  | "edit-card"
  | "card-themes"
  | "settings"
  | "appearance"
  | "security"
  | "reset-password";
const APP_PAGE_HISTORY_KEY = "riocardPlannerPage";
const APP_PAGE_HISTORY_PREVIOUS_KEY = "riocardPlannerPreviousPage";
const DEFAULT_APP_THEME: AppThemeKey = "oceano";

const isAppPage = (value: unknown): value is AppPage =>
  value === "home" ||
  value === "profile" ||
  value === "calendar" ||
  value === "history" ||
  value === "account-data" ||
  value === "accessibility" ||
  value === "edit-card" ||
  value === "card-themes" ||
  value === "settings" ||
  value === "appearance" ||
  value === "security" ||
  value === "reset-password";

type SecuritySettings = {
  confirmSensitiveActions: boolean;
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  confirmSensitiveActions: true,
};

type TextSize = "normal" | "large" | "larger";
type AccessibilitySettings = {
  textSize: TextSize;
  highContrast: boolean;
};

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  textSize: "normal",
  highContrast: false,
};

type Account = {
  id: string;
  firstName: string;
  email: string;
  celular: string;
  role: "client" | "admin";
  rememberMe?: boolean;
};

type Cartao = {
  id: string;
  nome: string;
  saldo: string;
  tarifa: string;
  viagens: string;
  inicio: string;
  saldoPrivado: boolean;
  cor: CardColorKey;
};

type SavedUserData = Partial<Cartao> & {
  cards?: unknown;
  activeCardId?: unknown;
  appearanceTheme?: unknown;
  securitySettings?: unknown;
  accessibilitySettings?: unknown;
};

const getCardTheme = (cor?: string) => {
  const key = cor && cor in CARD_THEMES ? (cor as CardColorKey) : "azul";
  return CARD_THEMES[key];
};

const normalizeCardTheme = (value: unknown): CardColorKey => {
  const key = String(value ?? "");
  if (key in CARD_THEMES) return key as CardColorKey;
  return LEGACY_CARD_THEME_MAP[key] ?? "azul";
};

function CardDecoration({ type }: { type: CardDecorationKey }) {
  if (!(["natal", "carnaval", "praia", "espaco"] as CardDecorationKey[]).includes(type)) {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 z-0 -translate-y-1/2 text-[76px] leading-none opacity-40 drop-shadow-sm"
      >
        {CARD_DECORATION_SYMBOLS[type]}
      </span>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 120"
      className="pointer-events-none absolute right-2 top-[44%] z-0 size-28 -translate-y-1/2 opacity-35 drop-shadow-sm"
    >
      {type === "natal" ? (
        <>
          <path d="M60 12 43 35h11L36 56h13L31 78h58L71 56h13L66 35h11L60 12Z" fill="#e8fff1" />
          <rect x="55" y="78" width="10" height="14" rx="2" fill="#f5c66b" />
          <circle cx="60" cy="37" r="3.5" fill="#ffd166" />
          <circle cx="48" cy="57" r="3" fill="#fb7185" />
          <circle cx="70" cy="65" r="3" fill="#facc15" />
          <path d="m24 27 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm70 36 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#fff" />
        </>
      ) : null}
      {type === "carnaval" ? (
        <>
          <path d="M30 57c8-10 17-10 25-2 3-4 7-6 11-6s8 2 11 6c8-8 17-8 25 2-5 18-16 27-25 20-4-3-7-7-11-7s-7 4-11 7c-9 7-20-2-25-20Z" fill="#fde68a" />
          <path d="M53 56c2 6 4 9 7 9s5-3 7-9" fill="none" stroke="#7c3aed" strokeWidth="3" />
          <circle cx="30" cy="32" r="5" fill="#f9a8d4" />
          <circle cx="87" cy="29" r="4" fill="#67e8f9" />
          <circle cx="94" cy="83" r="5" fill="#86efac" />
          <path d="m49 20 4 10m22 1 6-12M22 79l10-4m48 26 3-11" stroke="#fff" strokeLinecap="round" strokeWidth="4" />
        </>
      ) : null}
      {type === "praia" ? (
        <>
          <circle cx="78" cy="38" r="19" fill="#fde68a" />
          <path d="M20 69c12-10 23-10 35 0s23 10 35 0" fill="none" stroke="#cffafe" strokeLinecap="round" strokeWidth="6" />
          <path d="M14 84c12-10 23-10 35 0s23 10 35 0 15-8 22-4" fill="none" stroke="#67e8f9" strokeLinecap="round" strokeWidth="5" />
          <path d="M68 15V9m24 10 5-5m-38 5-5-5m51 23h7" stroke="#fff3c4" strokeLinecap="round" strokeWidth="3" />
        </>
      ) : null}
      {type === "espaco" ? (
        <>
          <ellipse cx="64" cy="62" rx="42" ry="15" fill="none" stroke="#f5d0fe" strokeWidth="4" transform="rotate(-25 64 62)" />
          <circle cx="64" cy="58" r="23" fill="#c4b5fd" />
          <path d="M47 54c8-8 18-10 31-5M48 65c8 5 17 6 28 3" fill="none" stroke="#8b5cf6" strokeLinecap="round" strokeWidth="4" />
          <circle cx="22" cy="35" r="3" fill="#fff" />
          <circle cx="96" cy="33" r="2.5" fill="#fde68a" />
          <circle cx="93" cy="92" r="3" fill="#fff" />
          <path d="m30 78 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Z" fill="#fff" />
        </>
      ) : null}
    </svg>
  );
}

function CardThemePreview({ themeKey }: { themeKey: CardColorKey }) {
  const theme = CARD_THEMES[themeKey];

  return (
    <div
      aria-hidden="true"
      className="relative isolate h-32 overflow-hidden rounded-[16px] p-3 text-white shadow-inner"
      style={{
        background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.via} 48%, ${theme.to} 100%)`,
      }}
    >
      <span className="relative z-10 text-sm font-black italic tracking-tight drop-shadow-sm">
        RioCard <span className="font-semibold">Mais</span>
      </span>
      {theme.decoration ? <CardDecoration type={theme.decoration} /> : null}
      <span className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-[9px] font-bold tracking-[0.16em] text-white/75">
        <span>•••• &nbsp;•••• &nbsp;••••</span>
        <Wifi className="size-4 rotate-90" />
      </span>
    </div>
  );
}

const getNomeCartaoExibicao = (nome?: string) =>
  (nome ?? "").trim() || "Cartão";

const formatarNomeCompleto = (nome: string) =>
  nome
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(
      /(^|[\s'-])(\p{L})/gu,
      (_match, separador: string, letra: string) =>
        `${separador}${letra.toLocaleUpperCase("pt-BR")}`,
    );

const normalizePhone = (valor: string) => valor.replace(/\D/g, "");

const formatarCelular = (valor: string) => {
  const digits = normalizePhone(valor).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};
const validarCelular = (valor: string) => {
  const celular = normalizePhone(valor);

  if (celular.length < 11) {
    return "Faltando o DDD. O celular precisa ter 11 dígitos, incluindo o DDD.";
  }

  if (celular.length > 11) {
    return "O celular deve ter exatamente 11 dígitos, incluindo o DDD.";
  }

  return null;
};
const getUserStorageKey = (celular: string) =>
  `${STORAGE_KEY}-${normalizePhone(celular) || "usuario"}`;
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set("X-Requested-With", "XMLHttpRequest");

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "same-origin",
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Operação falhou.");
  }

  return payload as T;
}

function RioBrand({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center">
      <span
        className={`${small ? "text-lg" : "text-[2rem]"} font-light tracking-[-0.06em] leading-none`}
      >
        <span className="text-[#0085fa]">RioCard</span>{" "}
        <span className="text-[#ff008c]">Mais</span>
      </span>
    </div>
  );
}

function Index() {
  const hoje = useMemo(() => new Date(), []);
  const [saldo, setSaldo] = useState("100");
  const [tarifa, setTarifa] = useState("4.70");
  const [viagens, setViagens] = useState("2");
  const [inicio, setInicio] = useState(iso(hoje));
  const [page, setPage] = useState<AppPage>("home");
  const [mesRef, setMesRef] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  );
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [cartaoAtivoId, setCartaoAtivoId] = useState<string | null>(null);
  const [abaTemasCartao, setAbaTemasCartao] = useState<"standard" | "decorative">("decorative");
  const [menuOpen, setMenuOpen] = useState(false);
  const [temaAparencia, setTemaAparencia] =
    useState<AppThemeKey>(DEFAULT_APP_THEME);
  const [authVerificando, setAuthVerificando] = useState(true);
  const [dadosUsuarioCarregados, setDadosUsuarioCarregados] = useState(false);
  const [temaSalvando, setTemaSalvando] = useState<AppThemeKey | null>(null);
  const [confirmarAcoesSensiveis, setConfirmarAcoesSensiveis] = useState(
    DEFAULT_SECURITY_SETTINGS.confirmSensitiveActions,
  );
  const [segurancaSalvando, setSegurancaSalvando] = useState(false);
  const [acessibilidade, setAcessibilidade] = useState<AccessibilitySettings>(
    DEFAULT_ACCESSIBILITY_SETTINGS,
  );
  const [acessibilidadeSalvando, setAcessibilidadeSalvando] = useState(false);
  const [cartaoAcoesId, setCartaoAcoesId] = useState<string | null>(null);
  const [novoCartaoAberto, setNovoCartaoAberto] = useState(false);
  const [novoCartaoIdEditando, setNovoCartaoIdEditando] = useState<string | null>(null);
  const [novoCartaoNome, setNovoCartaoNome] = useState("");
  const [novoCartaoCor, setNovoCartaoCor] = useState<CardColorKey>("azul");
  const [paginaAnteriorTemasCartao, setPaginaAnteriorTemasCartao] =
    useState<AppPage>("home");
  const [novoCartaoSaldo, setNovoCartaoSaldo] = useState("100");
  const [novoCartaoTarifa, setNovoCartaoTarifa] = useState("4.70");
  const [novoCartaoViagens, setNovoCartaoViagens] = useState("2");
  const [novoCartaoInicio, setNovoCartaoInicio] = useState(iso(hoje));
  const [salvandoNovoCartao, setSalvandoNovoCartao] = useState(false);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [session, setSession] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginCelular, setLoginCelular] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [cadastroNome, setCadastroNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroCelular, setCadastroCelular] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [cadastroConfirmacao, setCadastroConfirmacao] = useState("");
  const [dadosContaNome, setDadosContaNome] = useState("");
  const [dadosContaEmail, setDadosContaEmail] = useState("");
  const [dadosContaCelular, setDadosContaCelular] = useState("");
  const [dadosContaSalvando, setDadosContaSalvando] = useState(false);
  const [dadosContaErro, setDadosContaErro] = useState("");
  const [authError, setAuthError] = useState("");
  const [celularEmUso, setCelularEmUso] = useState(false);
  const [emailEmUso, setEmailEmUso] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoNovaSenha, setConfirmacaoNovaSenha] = useState("");
  const [senhaResetError, setSenhaResetError] = useState("");
  const [senhaResetSuccess, setSenhaResetSuccess] = useState("");
  const [senhaResetLoading, setSenhaResetLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselInicializadoRef = useRef(false);
  const pressaoCartaoTimerRef = useRef<number | null>(null);
  const pressaoCartaoInicioRef = useRef<{ x: number; y: number } | null>(null);
  const ignorarClickAposPressaoRef = useRef(false);
  const dadosUsuarioRequestRef = useRef(0);
  const temaApp = APP_THEMES[temaAparencia];
  const homeMenuBackground = "#f3f7fc";
  const estilosTemaApp = {
    backgroundColor: temaApp.background,
    "--primary": temaApp.primary,
    "--primary-foreground": "#ffffff",
    "--secondary": temaApp.soft,
    "--secondary-foreground": "#0b1f33",
    "--accent": temaApp.soft,
    "--accent-foreground": temaApp.primary,
    "--ring": temaApp.primary,
    "--brand-soft": temaApp.soft,
    "--brand-warm": temaApp.accent,
    "--brand-warm-foreground": "#ffffff",
    "--color-primary": temaApp.primary,
    "--color-primary-foreground": "#ffffff",
    "--color-secondary": temaApp.soft,
    "--color-secondary-foreground": "#0b1f33",
    "--color-accent": temaApp.soft,
    "--color-accent-foreground": temaApp.primary,
    "--color-ring": temaApp.primary,
    "--color-brand-soft": temaApp.soft,
    "--color-brand-warm": temaApp.accent,
    "--color-brand-warm-foreground": "#fffffff",
  } as CSSProperties;

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const previousFontSize = root.style.fontSize;
    const previousContrast = root.getAttribute("data-high-contrast");
    const fontSize =
      acessibilidade.textSize === "large"
        ? "18px"
        : acessibilidade.textSize === "larger"
          ? "20px"
          : "";

    root.style.fontSize = fontSize;
    root.setAttribute("data-high-contrast", String(acessibilidade.highContrast));

    return () => {
      root.style.fontSize = previousFontSize;
      if (previousContrast === null) {
        root.removeAttribute("data-high-contrast");
      } else {
        root.setAttribute("data-high-contrast", previousContrast);
      }
    };
  }, [acessibilidade]);

  useEffect(() => {
    window.history.replaceState(
      {
        ...window.history.state,
        [APP_PAGE_HISTORY_KEY]: "home",
        [APP_PAGE_HISTORY_PREVIOUS_KEY]: null,
      },
      "",
      window.location.href,
    );

    const restaurarPaginaAnterior = (event: PopStateEvent) => {
      const paginaAnterior = event.state?.[APP_PAGE_HISTORY_KEY];
      if (isAppPage(paginaAnterior)) {
        setPage(paginaAnterior);
      }
    };

    window.addEventListener("popstate", restaurarPaginaAnterior);
    return () => window.removeEventListener("popstate", restaurarPaginaAnterior);
  }, []);

  useEffect(
    () => () => {
      if (pressaoCartaoTimerRef.current !== null) {
        window.clearTimeout(pressaoCartaoTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!novoCartaoAberto || page === "card-themes") return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !salvandoNovoCartao) {
        setNovoCartaoAberto(false);
      }
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [novoCartaoAberto, salvandoNovoCartao, page]);

  useEffect(() => {
    if (page !== "card-themes") return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.history.back();
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [page]);

  useEffect(() => {
    // Remove only the obsolete client-side auth artifacts; planner data can be migrated below.
    localStorage.removeItem("riocard-session");
    localStorage.removeItem("riocard-accounts");
    let active = true;
    void apiRequest<{ user: Account }>("/auth/me")
      .then(({ user }) => {
        if (active) {
          setSession(user);
          setAuthVerificando(false);
        }
      })
      .catch(() => {
        if (active) {
          setSession(null);
          setAuthVerificando(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const aplicarCartaoAtivo = useCallback((cartao: Cartao | null) => {
    if (!cartao) return;
    setSaldo(cartao.saldo);
    setTarifa(cartao.tarifa);
    setViagens(cartao.viagens);
    setInicio(cartao.inicio);
  }, []);

  const criarCartaoPadrao = useCallback(
    (nome = "Cartão principal", overrides: Partial<Cartao> = {}): Cartao => ({
      id: `cartao-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      nome,
      saldo: "100",
      tarifa: "4.70",
      viagens: "2",
      inicio: iso(hoje),
      saldoPrivado: true,
      cor: "azul",
      ...overrides,
    }),
    [hoje],
  );

  const carregarDadosDoUsuario = useCallback(
    async (usuario: Account) => {
      const requestId = ++dadosUsuarioRequestRef.current;
      const normalizarCartoes = (salvo: SavedUserData) => {
        const cardsRaw = Array.isArray(salvo.cards)
          ? (salvo.cards as Array<Partial<Cartao>>)
          : [];
        if (cardsRaw.length > 0) {
          return cardsRaw.map((card, index) => ({
            id: String(card.id ?? `cartao-${index + 1}`),
            nome: String(card.nome ?? `Cartão ${index + 1}`),
            saldo: String(card.saldo ?? "100"),
            tarifa: String(card.tarifa ?? "4.70"),
            viagens: String(card.viagens ?? "2"),
            inicio: String(card.inicio ?? iso(hoje)),
            saldoPrivado:
              typeof card.saldoPrivado === "boolean" ? card.saldoPrivado : true,
            cor: normalizeCardTheme(card.cor),
          }));
        }

        return [
          criarCartaoPadrao("Cartão principal", {
            saldo: String(salvo.saldo ?? "100"),
            tarifa: String(salvo.tarifa ?? "4.70"),
            viagens: String(salvo.viagens ?? "2"),
            inicio: String(salvo.inicio ?? iso(hoje)),
            saldoPrivado:
              typeof salvo.saldoPrivado === "boolean"
                ? salvo.saldoPrivado
                : true,
          }),
        ];
      };

      try {
        const response = await apiRequest<{ data?: SavedUserData }>(
          "/user-data",
        );
        if (requestId !== dadosUsuarioRequestRef.current) return;
        let salvo = response.data ?? {};
        if (Object.keys(salvo).length === 0) {
          const legacyKey = getUserStorageKey(usuario.celular);
          const rawLegacy = localStorage.getItem(legacyKey);
          if (rawLegacy) {
            try {
              const legado = JSON.parse(rawLegacy) as SavedUserData;
              if (requestId !== dadosUsuarioRequestRef.current) return;
              await apiRequest("/user-data", {
                method: "POST",
                body: JSON.stringify({ data: legado }),
              });
              salvo = legado;
              localStorage.removeItem(legacyKey);
            } catch {
              // Os dados antigos permanecem no navegador se a migração ainda não puder ser concluída.
            }
          }
        }

        if (requestId !== dadosUsuarioRequestRef.current) return;

        const normalizedCards = normalizarCartoes(salvo);
        setCartoes(normalizedCards);
        const savedActiveId = salvo.activeCardId;
        const activeId =
          typeof savedActiveId === "string" &&
          normalizedCards.some((item) => item.id === savedActiveId)
            ? savedActiveId
            : (normalizedCards[0]?.id ?? null);
        setCartaoAtivoId(activeId);
        const savedTheme = salvo.appearanceTheme;
        setTemaAparencia(
          typeof savedTheme === "string" && savedTheme in APP_THEMES
            ? (savedTheme as AppThemeKey)
            : DEFAULT_APP_THEME,
        );
        const savedSecuritySettings =
          typeof salvo.securitySettings === "object" && salvo.securitySettings !== null
            ? (salvo.securitySettings as Partial<SecuritySettings>)
            : {};
        setConfirmarAcoesSensiveis(
          typeof savedSecuritySettings.confirmSensitiveActions === "boolean"
            ? savedSecuritySettings.confirmSensitiveActions
            : DEFAULT_SECURITY_SETTINGS.confirmSensitiveActions,
        );
        const savedAccessibilitySettings =
          typeof salvo.accessibilitySettings === "object" &&
          salvo.accessibilitySettings !== null
            ? (salvo.accessibilitySettings as Partial<AccessibilitySettings>)
            : {};
        setAcessibilidade({
          textSize:
            savedAccessibilitySettings.textSize === "large" ||
            savedAccessibilitySettings.textSize === "larger"
              ? savedAccessibilitySettings.textSize
              : DEFAULT_ACCESSIBILITY_SETTINGS.textSize,
          highContrast:
            typeof savedAccessibilitySettings.highContrast === "boolean"
              ? savedAccessibilitySettings.highContrast
              : DEFAULT_ACCESSIBILITY_SETTINGS.highContrast,
        });
        aplicarCartaoAtivo(
          normalizedCards.find((item) => item.id === activeId) ??
            normalizedCards[0] ??
            null,
        );
        setDadosUsuarioCarregados(true);
      } catch (error) {
        if (requestId !== dadosUsuarioRequestRef.current) return;
        setTemaAparencia(DEFAULT_APP_THEME);
        setDadosUsuarioCarregados(true);
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os dados da conta.",
        );
      }
    },
    [aplicarCartaoAtivo, criarCartaoPadrao, hoje],
  );

  useEffect(() => {
    if (!session) {
      dadosUsuarioRequestRef.current++;
      setDadosUsuarioCarregados(false);
      setTemaAparencia(DEFAULT_APP_THEME);
      setCartoes([]);
      setCartaoAtivoId(null);
      setAcessibilidade(DEFAULT_ACCESSIBILITY_SETTINGS);
      setSaldo("100");
      setTarifa("4.70");
      setViagens("2");
      setInicio(iso(hoje));
      return;
    }
    setDadosUsuarioCarregados(false);
    setTemaAparencia(DEFAULT_APP_THEME);
    setAcessibilidade(DEFAULT_ACCESSIBILITY_SETTINGS);
    setCartoes([]);
    setCartaoAtivoId(null);
    setSaldo("100");
    setTarifa("4.70");
    setViagens("2");
    setInicio(iso(hoje));
    void carregarDadosDoUsuario(session);
  }, [carregarDadosDoUsuario, session, hoje]);

  useEffect(() => {
    const celular = normalizePhone(cadastroCelular);
    if (celular.length !== 11) {
      setCelularEmUso(false);
      return;
    }

    let ativo = true;

    apiRequest<{ exists?: boolean }>(
      "/auth/check-phone?celular=" + encodeURIComponent(celular),
    )
      .then((response) => {
        if (ativo) {
          setCelularEmUso(Boolean(response.exists));
        }
      })
      .catch(() => {
        if (ativo) {
          setCelularEmUso(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [cadastroCelular]);

  useEffect(() => {
    const email = cadastroEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailEmUso(false);
      return;
    }
    let active = true;
    apiRequest<{ exists?: boolean }>(
      "/auth/check-email?email=" + encodeURIComponent(email),
    )
      .then(({ exists }) => {
        if (active) setEmailEmUso(Boolean(exists));
      })
      .catch(() => {
        if (active) setEmailEmUso(false);
      });
    return () => {
      active = false;
    };
  }, [cadastroEmail]);

  const alternarSaldoPrivado = (id: string) => {
    const proximoEstado = cartoes.map((cartao) => {
      if (cartao.id !== id) return cartao;
      return { ...cartao, saldoPrivado: !(cartao.saldoPrivado ?? true) };
    });

    setCartoes(proximoEstado);

    if (session) {
      void apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: proximoEstado,
            activeCardId: cartaoAtivoId,
            appearanceTheme: temaAparencia,
            securitySettings: {
              confirmSensitiveActions: confirmarAcoesSensiveis,
            },
            accessibilitySettings: acessibilidade,
          },
        }),
      }).catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a preferência do saldo.",
        );
      });
    }
  };

  const abrirPagina = (
    novaPagina: AppPage,
  ) => {
    if (window.history.state?.[APP_PAGE_HISTORY_KEY] !== novaPagina) {
      window.history.pushState(
        {
          ...window.history.state,
          [APP_PAGE_HISTORY_KEY]: novaPagina,
          [APP_PAGE_HISTORY_PREVIOUS_KEY]:
            window.history.state?.[APP_PAGE_HISTORY_KEY] ?? page,
        },
        "",
        window.location.href,
      );
    }
    setPage(novaPagina);
  };

  const abrirDadosDaConta = () => {
    if (!session) return;
    setDadosContaNome(session.firstName);
    setDadosContaEmail(session.email);
    setDadosContaCelular(formatarCelular(session.celular));
    setDadosContaErro("");
    abrirPagina("account-data");
  };

  const salvarDadosDaConta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || dadosContaSalvando) return;

    const nome = dadosContaNome.trim();
    const email = dadosContaEmail.trim().toLowerCase();
    const celular = normalizePhone(dadosContaCelular);

    if (!nome || !email || !celular) {
      setDadosContaErro("Preencha nome, email e celular.");
      return;
    }
    if (nome.length > 120) {
      setDadosContaErro("O nome deve ter até 120 caracteres.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setDadosContaErro("Informe um email válido.");
      return;
    }
    const erroCelular = validarCelular(dadosContaCelular);
    if (erroCelular) {
      setDadosContaErro(erroCelular);
      return;
    }

    setDadosContaSalvando(true);
    setDadosContaErro("");
    try {
      const response = await apiRequest<{ user: Account; message?: string }>(
        "/auth/account",
        {
          method: "PUT",
          body: JSON.stringify({ name: nome, email, celular }),
        },
      );
      setSession((current) =>
        current
          ? {
              ...current,
              ...response.user,
              ...(current.rememberMe === undefined
                ? {}
                : { rememberMe: current.rememberMe }),
            }
          : current,
      );
      setDadosContaNome(response.user.firstName);
      setDadosContaEmail(response.user.email);
      setDadosContaCelular(formatarCelular(response.user.celular));
      toast.success(response.message ?? "Dados da conta atualizados.");
    } catch (error) {
      setDadosContaErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os dados da conta.",
      );
    } finally {
      setDadosContaSalvando(false);
    }
  };

  const abrirTemasDoCartao = (paginaOrigem: "home" | "edit-card") => {
    setPaginaAnteriorTemasCartao(paginaOrigem);
    abrirPagina("card-themes");
  };

  const selecionarTemaCartao = (tema: CardColorKey) => {
    setNovoCartaoCor(tema);
    if (window.history.state?.[APP_PAGE_HISTORY_KEY] === "card-themes") {
      window.history.back();
    } else {
      abrirPagina(paginaAnteriorTemasCartao);
    }
  };

  const selecionarCartao = (id: string) => {
    const cartao = cartoes.find((item) => item.id === id);
    if (!cartao) return;
    setCartaoAtivoId(id);
    aplicarCartaoAtivo(cartao);

    if (page === "home") {
      requestAnimationFrame(() => {
        cardRefs.current[id]?.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
    }
  };

  const handleCardScroll = () => {
    const container = carouselRef.current;
    if (!container || cartoes.length === 0) return;

    const centroContainer =
      container.getBoundingClientRect().left + container.clientWidth / 2;
    const cartao = cartoes.reduce<Cartao | null>((maisProximo, atual) => {
      const elemento = cardRefs.current[atual.id];
      if (!elemento) return maisProximo;

      const bounds = elemento.getBoundingClientRect();
      const distanciaAtual = Math.abs(
        bounds.left + bounds.width / 2 - centroContainer,
      );
      if (!maisProximo) return atual;

      const elementoMaisProximo = cardRefs.current[maisProximo.id];
      if (!elementoMaisProximo) return atual;

      const boundsMaisProximo = elementoMaisProximo.getBoundingClientRect();
      const distanciaMaisProximo = Math.abs(
        boundsMaisProximo.left + boundsMaisProximo.width / 2 - centroContainer,
      );

      return distanciaAtual < distanciaMaisProximo ? atual : maisProximo;
    }, null);

    if (cartao && cartao.id !== cartaoAtivoId) {
      setCartaoAtivoId(cartao.id);
      aplicarCartaoAtivo(cartao);
    }
  };

  useEffect(() => {
    if (
      page !== "home" ||
      !cartaoAtivoId ||
      !carouselRef.current ||
      carouselInicializadoRef.current
    ) {
      return;
    }

    const container = carouselRef.current;
    const cartao = cardRefs.current[cartaoAtivoId];
    if (!cartao) return;

    const containerBounds = container.getBoundingClientRect();
    const cartaoBounds = cartao.getBoundingClientRect();
    container.scrollLeft += cartaoBounds.left - containerBounds.left;
    carouselInicializadoRef.current = true;
  }, [page, cartaoAtivoId, cartoes.length]);

  const selecionarTemaAparencia = async (novoTema: AppThemeKey) => {
    if (
      !session ||
      !dadosUsuarioCarregados ||
      temaSalvando ||
      novoTema === temaAparencia
    ) {
      return;
    }

    const temaAnterior = temaAparencia;
    setTemaAparencia(novoTema);
    setTemaSalvando(novoTema);

    try {
      await apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: cartoes,
            activeCardId: cartaoAtivoId,
            appearanceTheme: novoTema,
            securitySettings: {
              confirmSensitiveActions: confirmarAcoesSensiveis,
            },
            accessibilitySettings: acessibilidade,
          },
        }),
      });
      toast.success(`Tema ${APP_THEMES[novoTema].name} salvo.`);
    } catch (error) {
      setTemaAparencia(temaAnterior);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o tema.",
      );
    } finally {
      setTemaSalvando(null);
    }
  };

  const atualizarSeguranca = async (novoValor: boolean) => {
    if (!session) return;

    setConfirmarAcoesSensiveis(novoValor);
    setSegurancaSalvando(true);

    try {
      await apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: cartoes,
            activeCardId: cartaoAtivoId,
            appearanceTheme: temaAparencia,
            securitySettings: {
              confirmSensitiveActions: novoValor,
            },
            accessibilitySettings: acessibilidade,
          },
        }),
      });
      toast.success(
        novoValor
          ? "Confirmações sensíveis ativadas."
          : "Confirmações sensíveis desativadas.",
      );
    } catch (error) {
      setConfirmarAcoesSensiveis(!novoValor);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a configuração de segurança.",
      );
    } finally {
      setSegurancaSalvando(false);
    }
  };

  const atualizarAcessibilidade = async (
    proxima: AccessibilitySettings,
  ) => {
    if (!session || acessibilidadeSalvando) return;

    const anterior = acessibilidade;
    setAcessibilidade(proxima);
    setAcessibilidadeSalvando(true);
    try {
      await apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: cartoes,
            activeCardId: cartaoAtivoId,
            appearanceTheme: temaAparencia,
            securitySettings: {
              confirmSensitiveActions: confirmarAcoesSensiveis,
            },
            accessibilitySettings: proxima,
          },
        }),
      });
      toast.success("Preferências de acessibilidade salvas.");
    } catch (error) {
      setAcessibilidade(anterior);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as preferências de acessibilidade.",
      );
    } finally {
      setAcessibilidadeSalvando(false);
    }
  };

  const confirmarAcaoSensivel = (mensagem: string) => {
    if (!confirmarAcoesSensiveis) return true;
    return window.confirm(mensagem);
  };

  const redefinirSenha = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    if (!senhaAtual.trim() || !novaSenha.trim() || !confirmacaoNovaSenha.trim()) {
      setSenhaResetError("Preencha todos os campos para redefinir a senha.");
      setSenhaResetSuccess("");
      return;
    }
    if (novaSenha.length < 8 || novaSenha.length > 72) {
      setSenhaResetError("A nova senha precisa ter entre 8 e 72 caracteres.");
      setSenhaResetSuccess("");
      return;
    }
    if (novaSenha !== confirmacaoNovaSenha) {
      setSenhaResetError("A nova senha e a confirmação precisam ser iguais.");
      setSenhaResetSuccess("");
      return;
    }

    setSenhaResetLoading(true);
    setSenhaResetError("");
    setSenhaResetSuccess("");

    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: senhaAtual,
          newPassword: novaSenha,
          confirmPassword: confirmacaoNovaSenha,
        }),
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoNovaSenha("");
      setSenhaResetSuccess("Senha redefinida com sucesso.");
      toast.success("Senha redefinida com sucesso.");
    } catch (error) {
      setSenhaResetError(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha.",
      );
      setSenhaResetSuccess("");
    } finally {
      setSenhaResetLoading(false);
    }
  };

  const abrirCriacaoCartao = () => {
    setNovoCartaoIdEditando(null);
    setNovoCartaoNome(`Cartão ${cartoes.length + 1}`);
    setNovoCartaoCor("azul");
    setNovoCartaoSaldo("100");
    setNovoCartaoTarifa("4.70");
    setNovoCartaoViagens("2");
    setNovoCartaoInicio(iso(new Date()));
    setNovoCartaoAberto(true);
  };

  const abrirEdicaoCartao = (cartao: Cartao) => {
    setNovoCartaoIdEditando(cartao.id);
    setNovoCartaoNome(cartao.nome);
    setNovoCartaoCor(cartao.cor);
    setNovoCartaoSaldo(cartao.saldo);
    setNovoCartaoTarifa(cartao.tarifa);
    setNovoCartaoViagens(cartao.viagens);
    setNovoCartaoInicio(cartao.inicio);
    setCartaoAcoesId(null);
    setNovoCartaoAberto(false);
    abrirPagina("edit-card");
  };

  const criarNovoCartao = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || salvandoNovoCartao) return;

    const nome = novoCartaoNome.trim();
    if (!nome) {
      toast.error("Informe um nome para o cartão.");
      return;
    }

    const cartaoEditado = cartoes.find(
      (cartao) => cartao.id === novoCartaoIdEditando,
    );
    const cartaoSalvo = cartaoEditado
      ? {
          ...cartaoEditado,
          nome,
          cor: novoCartaoCor,
          saldo: novoCartaoSaldo,
          tarifa: novoCartaoTarifa,
          viagens: novoCartaoViagens,
          inicio: novoCartaoInicio,
        }
      : criarCartaoPadrao(nome, {
          saldo: novoCartaoSaldo,
          tarifa: novoCartaoTarifa,
          viagens: novoCartaoViagens,
          inicio: novoCartaoInicio,
          cor: novoCartaoCor,
        });
    const cartoesAtualizados = cartaoEditado
      ? cartoes.map((cartao) =>
          cartao.id === cartaoSalvo.id ? cartaoSalvo : cartao,
        )
      : [...cartoes, cartaoSalvo];
    const novoAtivoId = cartaoEditado ? cartaoAtivoId : cartaoSalvo.id;

    setSalvandoNovoCartao(true);
    try {
      await apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: cartoesAtualizados,
            activeCardId: novoAtivoId,
            appearanceTheme: temaAparencia,
            securitySettings: {
              confirmSensitiveActions: confirmarAcoesSensiveis,
            },
            accessibilitySettings: acessibilidade,
          },
        }),
      });

      setCartoes(cartoesAtualizados);
      setCartaoAtivoId(novoAtivoId);
      if (!cartaoEditado || novoAtivoId === cartaoSalvo.id) {
        aplicarCartaoAtivo(cartaoSalvo);
      }
      if (cartaoEditado) {
        window.history.back();
      } else {
        setPage("home");
      }
      setNovoCartaoAberto(false);
      setNovoCartaoIdEditando(null);
      setCartaoAcoesId(null);
      toast.success(
        cartaoEditado
          ? "Cartão atualizado com sucesso."
          : "Cartão criado com sucesso.",
      );
      if (!cartaoEditado || novoAtivoId === cartaoSalvo.id) {
        requestAnimationFrame(() => {
          cardRefs.current[cartaoSalvo.id]?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o cartão.",
      );
    } finally {
      setSalvandoNovoCartao(false);
    }
  };

  const removerCartao = async (id: string) => {
    const restante = cartoes.filter((cartao) => cartao.id !== id);
    const proximoAtivoId = restante.some(
      (cartao) => cartao.id === cartaoAtivoId,
    )
      ? cartaoAtivoId
      : (restante[0]?.id ?? null);

    try {
      await apiRequest("/user-data", {
        method: "POST",
        body: JSON.stringify({
          data: {
            cards: restante,
            activeCardId: proximoAtivoId,
            appearanceTheme: temaAparencia,
            securitySettings: {
              confirmSensitiveActions: confirmarAcoesSensiveis,
            },
            accessibilitySettings: acessibilidade,
          },
        }),
      });

      setCartoes(restante);
      setCartaoAtivoId(proximoAtivoId);
      if (cartaoAtivoId === id) {
        const proximoAtivo = restante.find(
          (cartao) => cartao.id === proximoAtivoId,
        );
        if (proximoAtivo) aplicarCartaoAtivo(proximoAtivo);
      }
      setCartaoAcoesId(null);
      toast.success("Cartão deletado com sucesso.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível deletar o cartão.",
      );
    }
  };

  const entrarNaConta = async () => {
    const identifier = loginCelular.trim();
    const erroCelular = identifier.includes("@")
      ? null
      : validarCelular(identifier);

    if (!identifier || !loginSenha.trim()) {
      setAuthError("Informe o email ou celular e a senha.");
      return;
    }
    if (erroCelular) {
      setAuthError(erroCelular);
      return;
    }

    try {
      setDadosUsuarioCarregados(false);
      const response = await apiRequest<{ user: Account }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password: loginSenha, rememberMe }),
      });
      setSession({ ...response.user, rememberMe });
      setAuthError("");
      setPage("home");
      setLoginCelular("");
      setLoginSenha("");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Email/celular ou senha inválidos.",
      );
    }
  };

  const criarConta = async () => {
    const nome = cadastroNome.trim();
    const email = cadastroEmail.trim().toLowerCase();
    const celular = normalizePhone(cadastroCelular);
    const senha = cadastroSenha;
    const confirmacao = cadastroConfirmacao;
    const erroCelular = validarCelular(cadastroCelular);

    if (!nome || !email || !celular || !senha || !confirmacao) {
      setAuthError("Preencha todos os campos para cadastrar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAuthError("Informe um email válido.");
      return;
    }
    if (erroCelular) {
      setAuthError(erroCelular);
      return;
    }
    if (celularEmUso || emailEmUso) {
      setAuthError("Este email ou celular já está cadastrado.");
      return;
    }
    if (senha.length < 8) {
      setAuthError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setAuthError("A confirmação da senha precisa bater com a senha.");
      return;
    }

    try {
      setDadosUsuarioCarregados(false);
      const response = await apiRequest<{ user: Account }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: nome,
          email,
          celular,
          password: senha,
          rememberMe,
        }),
      });
      setSession({ ...response.user, rememberMe });
      setAuthError("");
      setCadastroNome("");
      setCadastroEmail("");
      setCadastroCelular("");
      setCadastroSenha("");
      setCadastroConfirmacao("");
      setPage("home");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.",
      );
    }
  };

  const sairDaConta = () => {
    void apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
    dadosUsuarioRequestRef.current++;
    setDadosUsuarioCarregados(false);
    setSession(null);
    setPage("home");
    setAuthError("");
  };

  const calc = useMemo(() => {
    const valor = Number(saldo.replace(",", ".")) || 0;
    const preco = Number(tarifa.replace(",", ".")) || 0;
    const custoDia = preco * (Number(viagens) || 0);
    const partesInicio = inicio.split("-").map(Number);
    const dataInicio = new Date(
      partesInicio[0] || 1970,
      (partesInicio[1] || 1) - 1,
      partesInicio[2] || 1,
    );
    const diasCobertos = custoDia > 0 ? Math.floor(valor / custoDia) : 0;
    const sobra = custoDia > 0 ? valor - diasCobertos * custoDia : valor;
    const cobertos: string[] = [];
    const cursor = new Date(dataInicio);
    let guard = 0;
    while (cobertos.length < diasCobertos && guard < 2000) {
      if (cursor.getDay() >= 1 && cursor.getDay() <= 5)
        cobertos.push(iso(cursor));
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    let recarga: string | null = null;
    guard = 0;
    while (!recarga && guard < 2000) {
      if (cursor.getDay() >= 1 && cursor.getDay() <= 5)
        recarga = iso(cursor);
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    return {
      custoDia,
      diasCobertos,
      sobra,
      cobertos: new Set(cobertos),
      ultimoDia: cobertos.at(-1) ?? null,
      recarga,
      totalGasto: diasCobertos * custoDia,
    };
  }, [saldo, tarifa, viagens, inicio]);

  const saldoPrivadoAtivo =
    cartoes.find((cartao) => cartao.id === cartaoAtivoId)?.saldoPrivado ?? true;

  const historicoUso = useMemo(() => {
    const saldoInicial = Number(saldo.replace(",", ".")) || 0;
    const custoDia =
      (Number(tarifa.replace(",", ".")) || 0) * (Number(viagens) || 0);
    const partesInicio = inicio.split("-").map(Number);
    const cursor = new Date(
      partesInicio[0] || 1970,
      (partesInicio[1] || 1) - 1,
      partesInicio[2] || 1,
    );
    const limite = new Date(hoje);
    limite.setHours(0, 0, 0, 0);
    const maximoDiasCobertos =
      custoDia > 0 ? Math.floor(saldoInicial / custoDia) : 0;
    const registros: { data: string; gasto: number; saldoApos: number }[] = [];
    let diasUteis = 0;
    let guard = 0;

    while (
      cursor <= limite &&
      diasUteis < maximoDiasCobertos &&
      guard < 2000
    ) {
      if (cursor.getDay() >= 1 && cursor.getDay() <= 5 && custoDia > 0) {
        diasUteis++;
        registros.push({
          data: iso(cursor),
          gasto: custoDia,
          saldoApos: Math.max(0, saldoInicial - diasUteis * custoDia),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }

    return {
      diasUteis,
      totalGasto: diasUteis * custoDia,
      saldoRestante: Math.max(0, saldoInicial - diasUteis * custoDia),
      registros: registros.reverse().slice(0, 20),
    };
  }, [saldo, tarifa, viagens, inicio, hoje]);

  const grade = useMemo(() => {
    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const cells: (Date | null)[] = Array.from(
      { length: new Date(ano, mes, 1).getDay() },
      () => null,
    );
    for (let dia = 1; dia <= new Date(ano, mes + 1, 0).getDate(); dia++)
      cells.push(new Date(ano, mes, dia));
    return cells;
  }, [mesRef]);

  const instalarNoCelular = async () => {
    if (!installPrompt) {
      toast.error(
        "Instalação não disponível no momento. Tente em outro navegador ou use o botão de menu do celular.",
      );
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      toast.success("App instalado com sucesso!");
    }

    setInstallPrompt(null);
  };

  const diasAulaNoMes = grade.filter(
    (d) => d && calc.cobertos.has(iso(d)),
  ).length;
  const mudarMes = (delta: number) =>
    setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const inicialUsuario = (
    session?.firstName?.trim().charAt(0) || "U"
  ).toUpperCase();

  if (authVerificando || (session && !dadosUsuarioCarregados)) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: temaApp.background }}
        aria-busy="true"
      >
        <section
          role="status"
          aria-label="Carregando aplicativo"
          className="flex flex-col items-center gap-7"
        >
          <img
            src={rioCardLogo}
            alt="RioCard Mais"
            className="h-14 w-auto max-w-[80vw] object-contain"
          />
          <span className="inline-flex" aria-hidden="true">
            <RefreshCw className="size-7 animate-spin text-primary" />
          </span>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f6fb] px-4 py-6 sm:px-6 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-36 size-[28rem] rounded-full bg-blue-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-28 size-[28rem] rounded-full bg-pink-200/35 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_30px_100px_rgba(28,55,90,0.16)] md:min-h-[660px] md:grid-cols-[0.95fr_1.05fr]">
          <section
            className="relative hidden flex-col justify-between overflow-hidden p-9 text-white md:flex lg:p-12"
            style={{
              background: `linear-gradient(145deg, ${temaApp.from} 0%, ${temaApp.to} 100%)`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 size-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-36 -left-28 size-96 rounded-full border border-white/10"
            />
            <div className="relative">
              <RioBrand />
              <div className="mt-16 max-w-md">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur">
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  Planejamento mais simples
                </span>
                <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight lg:text-[44px]">
                  Sua rotina de viagens, organizada.
                </h1>
                <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
                  Acompanhe seus cartões, planeje os dias de aula e saiba quando preparar a próxima recarga.
                </p>
              </div>
            </div>

            <div className="relative rounded-[22px] border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">
                    Seu planejamento
                  </p>
                  <p className="mt-1 text-lg font-extrabold">Tudo em um só lugar</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl border border-white/15 bg-white/15">
                  <WalletCards className="size-5" aria-hidden="true" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }, (_, index) => (
                  <span
                    key={index}
                    className={`flex aspect-square items-center justify-center rounded-lg text-[10px] font-bold ${index === 10 ? "bg-white text-primary" : index < 9 ? "bg-white/25 text-white" : "bg-white/10 text-white/60"}`}
                  >
                    {index + 8}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center bg-white px-5 py-7 sm:px-9 sm:py-10 lg:px-12">
            <div className="w-full max-w-md">
              <div className="mb-6 flex justify-center md:hidden">
                <RioBrand />
              </div>
              <div className="mb-7">
                {authMode === "register" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError("");
                    }}
                    className="mb-5 inline-flex items-center gap-2 rounded-lg py-1 text-sm font-bold text-slate-500 transition hover:-translate-x-0.5 hover:text-primary"
                  >
                    <ArrowLeft className="size-4 text-primary" aria-hidden="true" />
                    Voltar ao login
                  </button>
                ) : null}
                {authMode === "register" ? (
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">
                    Crie sua conta
                  </h2>
                ) : null}
              </div>

              {authError ? (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 animate-in fade-in slide-in-from-top-1 duration-200">
                  {authError}
                </p>
              ) : null}

              {authMode === "login" ? (
                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Email ou celular
                    </span>
                    <input
                      type="text"
                      autoComplete="username"
                      value={loginCelular}
                      onChange={(e) => setLoginCelular(e.target.value)}
                      placeholder="email@exemplo.com ou (00) 00000-0000"
                      className="field h-12 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Senha
                    </span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={loginSenha}
                      onChange={(e) => setLoginSenha(e.target.value)}
                      placeholder="Sua senha"
                      className="field h-12 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex-1 text-sm font-semibold text-slate-700">Manter conectado</span>
                    <span className="text-xs text-slate-400">{rememberMe ? "30 dias" : "24 horas"}</span>
                  </label>
                  <p className="pt-1 text-center text-sm text-slate-500">
                    Ainda não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError("");
                      }}
                      className="font-bold text-primary underline-offset-4 transition hover:underline"
                    >
                      Crie a sua conta
                    </button>
                  </p>
                  <Button className="group mt-2 h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30" size="lg" onClick={entrarNaConta}>
                    Entrar na conta
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3.5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Nome completo
                    </span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={cadastroNome}
                      onChange={(e) => setCadastroNome(e.target.value)}
                      placeholder="Seu nome completo"
                      className="field h-11 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Email
                    </span>
                    <input
                      type="email"
                      autoComplete="email"
                      value={cadastroEmail}
                      onChange={(e) => setCadastroEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="field h-11 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                    {emailEmUso ? (
                      <p className="mt-2 text-xs text-red-600">
                        Este email já está cadastrado.
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Celular
                    </span>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      value={cadastroCelular}
                      onChange={(e) =>
                        setCadastroCelular(formatarCelular(e.target.value))
                      }
                      placeholder="(00) 00000-0000"
                      className="field h-11 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                    {cadastroCelular.trim() && celularEmUso ? (
                      <p className="mt-2 text-xs text-red-600">
                        Este celular já está cadastrado.
                      </p>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Senha
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={cadastroSenha}
                      onChange={(e) => setCadastroSenha(e.target.value)}
                      placeholder="Crie uma senha"
                      className="field h-11 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-700">
                      Confirmação da senha
                    </span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={cadastroConfirmacao}
                      onChange={(e) => setCadastroConfirmacao(e.target.value)}
                      placeholder="Repita a senha"
                      className="field h-11 rounded-xl border-slate-200 bg-slate-50/70 transition focus:bg-white"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="size-4 accent-primary"
                    />
                    <span className="flex-1 text-sm font-semibold text-slate-700">Manter conectado</span>
                    <span className="text-xs text-slate-400">{rememberMe ? "30 dias" : "24 horas"}</span>
                  </label>
                  <Button className="group mt-2 h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30" size="lg" onClick={criarConta}>
                    Criar conta
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen px-0 py-0"
      style={{
        ...estilosTemaApp,
        background:
          page === "home" ? homeMenuBackground : temaApp.background,
      }}
    >
      <div
        className={`mx-auto min-h-screen overflow-hidden shadow-none ${page === "calendar" ? "w-full" : page === "history" ? "max-w-5xl" : page === "edit-card" || page === "card-themes" ? "max-w-4xl" : "max-w-md"}`}
        style={{
          background:
            page === "home" ? homeMenuBackground : temaApp.background,
        }}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          aria-hidden={!menuOpen}
          tabIndex={menuOpen ? 0 : -1}
          className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-300 motion-reduce:transition-none ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />

        <aside
          id="menu-lateral"
          aria-label="Menu lateral"
          aria-hidden={!menuOpen}
          inert={!menuOpen}
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(21rem,88vw)] flex-col overflow-y-auto rounded-r-[28px] border-r border-white/70 bg-white/95 p-5 shadow-[20px_0_60px_rgba(15,23,42,0.22)] backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${menuOpen ? "translate-x-0" : "-translate-x-[105%]"}`}
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="mb-7 flex items-center justify-between">
            <RioBrand small />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="h-9 w-9 rounded-full bg-brand-soft text-primary transition-all duration-200 hover:rotate-90 hover:bg-primary/10"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <button
            type="button"
            onClick={() => abrirPagina("profile")}
            aria-label={`Abrir perfil de ${formatarNomeCompleto(session.firstName)}`}
            className="group relative mb-7 w-full overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{
              background: `linear-gradient(135deg, ${temaApp.from}, ${temaApp.to})`,
            }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full border border-white/15"
            />
            <div className="relative flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-lg font-extrabold shadow-inner">
                {inicialUsuario}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold tracking-tight">{formatarNomeCompleto(session.firstName)}</p>
                <p className="truncate text-xs text-white/75">{session.email}</p>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
              <span>{session.role === "admin" ? "Administrador" : "Conta RioCard Mais"}</span>
              <span>{session.rememberMe ? "Sessão de 30 dias" : "Sessão de 24 horas"}</span>
            </div>
          </button>

          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
            Navegação
          </p>
          <nav className="space-y-1.5">
            <button
              type="button"
              aria-current={page === "home" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "home" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("home")}
            >
              <House className="size-[18px] text-primary" aria-hidden="true" />
              <span className="flex-1">Início</span>
              <ChevronRight className={`size-4 text-primary/70 transition-transform duration-200 ${page === "home" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current={page === "calendar" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "calendar" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("calendar")}
            >
              <CalendarDays className="size-[18px] text-primary" aria-hidden="true" />
              <span className="flex-1">Ver calendário</span>
              <ChevronRight className={`size-4 text-primary/70 transition-transform duration-200 ${page === "calendar" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current={page === "history" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "history" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("history")}
            >
              <History className="size-[18px] text-primary" aria-hidden="true" />
              <span className="flex-1">Histórico de uso</span>
              <ChevronRight className={`size-4 text-primary/70 transition-transform duration-200 ${page === "history" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current={page === "settings" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "settings" || page === "appearance" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("settings")}
            >
              <WalletCards className="size-[18px] text-primary" aria-hidden="true" />
              <span className="flex-1">Configurações</span>
              <ChevronRight className={`size-4 text-primary/70 transition-transform duration-200 ${page === "settings" || page === "appearance" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <p className="mt-3 px-3 text-[10px] font-medium text-slate-400">
              Planejador de passagens · RioCard Mais
            </p>
          </div>
        </aside>

        <div
          className="px-4 pb-6 pt-4"
          style={{
            background:
              page === "home" ? homeMenuBackground : temaApp.background,
          }}
        >
          {page === "home" ? (
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => abrirPagina("profile")}
                  aria-label={`Abrir perfil de ${formatarNomeCompleto(session.firstName)}`}
                  title="Meu perfil"
                  className="flex size-10 items-center justify-center rounded-full border border-[#dfe9f5] bg-white text-primary shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <UserRound className="size-4" aria-hidden="true" />
                </button>
                <span className="font-display text-sm font-semibold tracking-tight text-slate-700">
                  {formatarNomeCompleto(session.firstName)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => abrirPagina("settings")}
                aria-label="Abrir configurações"
                title="Configurações"
                className="flex size-10 items-center justify-center rounded-full border border-[#dfe9f5] bg-white text-primary shadow-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <Settings className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {page === "home" ? (
            <div className="space-y-4">
              <div
                ref={carouselRef}
                className="-mx-1 snap-x snap-mandatory touch-pan-x overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={handleCardScroll}
              >
                <div className="flex gap-3">
                  {cartoes.map((cartao) => {
                    const tema = getCardTheme(cartao.cor);
                    return (
                      <div
                        key={cartao.id}
                        ref={(element) => {
                          cardRefs.current[cartao.id] = element;
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${getNomeCartaoExibicao(cartao.nome)}. Toque para selecionar; pressione por um instante para abrir as opções.`}
                        aria-expanded={cartaoAcoesId === cartao.id}
                        onPointerDown={(event) => {
                          if (
                            (event.pointerType === "mouse" && event.button !== 0) ||
                            (event.target instanceof Element &&
                              event.target.closest("button"))
                          ) {
                            return;
                          }
                          ignorarClickAposPressaoRef.current = false;
                          pressaoCartaoInicioRef.current = {
                            x: event.clientX,
                            y: event.clientY,
                          };
                          if (pressaoCartaoTimerRef.current !== null) {
                            window.clearTimeout(pressaoCartaoTimerRef.current);
                          }
                          pressaoCartaoTimerRef.current = window.setTimeout(() => {
                            selecionarCartao(cartao.id);
                            setCartaoAcoesId(cartao.id);
                            ignorarClickAposPressaoRef.current = true;
                            pressaoCartaoTimerRef.current = null;
                          }, 320);
                        }}
                        onPointerMove={(event) => {
                          const inicioPressao = pressaoCartaoInicioRef.current;
                          if (!inicioPressao || pressaoCartaoTimerRef.current === null) {
                            return;
                          }
                          if (
                            Math.abs(event.clientX - inicioPressao.x) > 10 ||
                            Math.abs(event.clientY - inicioPressao.y) > 10
                          ) {
                            window.clearTimeout(pressaoCartaoTimerRef.current);
                            pressaoCartaoTimerRef.current = null;
                            pressaoCartaoInicioRef.current = null;
                          }
                        }}
                        onPointerUp={() => {
                          if (pressaoCartaoTimerRef.current !== null) {
                            window.clearTimeout(pressaoCartaoTimerRef.current);
                            pressaoCartaoTimerRef.current = null;
                          }
                          pressaoCartaoInicioRef.current = null;
                          if (ignorarClickAposPressaoRef.current) {
                            window.setTimeout(() => {
                              ignorarClickAposPressaoRef.current = false;
                            }, 500);
                          }
                        }}
                        onPointerCancel={() => {
                          if (pressaoCartaoTimerRef.current !== null) {
                            window.clearTimeout(pressaoCartaoTimerRef.current);
                            pressaoCartaoTimerRef.current = null;
                          }
                          pressaoCartaoInicioRef.current = null;
                          ignorarClickAposPressaoRef.current = false;
                        }}
                        onPointerLeave={() => {
                          if (pressaoCartaoTimerRef.current !== null) {
                            window.clearTimeout(pressaoCartaoTimerRef.current);
                            pressaoCartaoTimerRef.current = null;
                          }
                          pressaoCartaoInicioRef.current = null;
                        }}
                        onClick={() => {
                          if (ignorarClickAposPressaoRef.current) {
                            ignorarClickAposPressaoRef.current = false;
                            return;
                          }
                          selecionarCartao(cartao.id);
                          setCartaoAcoesId(null);
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.target instanceof Element &&
                            event.target.closest("button")
                          ) {
                            return;
                          }
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            ignorarClickAposPressaoRef.current = true;
                            window.setTimeout(() => {
                              ignorarClickAposPressaoRef.current = false;
                            }, 500);
                            if (cartaoAcoesId === cartao.id) {
                              setCartaoAcoesId(null);
                            } else {
                              selecionarCartao(cartao.id);
                              setCartaoAcoesId(cartao.id);
                            }
                          }
                        }}
                        className={`relative min-h-[244px] w-full shrink-0 snap-center touch-pan-x select-none overflow-hidden rounded-[24px] border border-white/30 p-5 text-left text-white transition-[transform,opacity,box-shadow] duration-300 ease-out will-change-transform ${cartaoAcoesId === cartao.id ? "scale-[0.97] ring-2 ring-white/80" : cartaoAtivoId === cartao.id ? "scale-[1.01] opacity-100 ring-2 ring-white/80" : "scale-[0.985] opacity-75"}`}
                        style={{
                          background: `linear-gradient(135deg, ${tema.from} 0%, ${tema.via} 48%, ${tema.to} 100%)`,
                          boxShadow: `0 18px 34px ${tema.glow}, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.12)`,
                        }}
                      >
                        <div
                          className={`transition-[filter,opacity,transform] duration-300 ${cartaoAcoesId === cartao.id ? "scale-[0.97] opacity-35 blur-[2px]" : ""}`}
                        >
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full border border-white/10"
                          />
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-5 -top-9 size-40 rounded-full border border-white/10"
                          />
                          {tema.decoration ? (
                            <CardDecoration type={tema.decoration} />
                          ) : null}
                          <div className="relative z-10 flex min-h-[202px] flex-col">
                            <div className="flex items-center justify-between">
                              <div className="text-[15px] font-black italic tracking-tight drop-shadow-sm">
                                RioCard <span className="font-semibold">Mais</span>
                              </div>
                              <Wifi
                                aria-hidden="true"
                                className="size-6 rotate-90 text-white/90 drop-shadow-sm"
                              />
                            </div>

                            <div className="mt-5">
                              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/65">
                                Cartão de transporte
                              </p>
                              <p className="mt-1 truncate text-xl font-extrabold tracking-tight drop-shadow-sm sm:text-2xl">
                                {getNomeCartaoExibicao(cartao.nome)}
                              </p>
                            </div>

                            <div className="mt-auto pt-4">
                              <div className="flex items-end justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                                    Saldo disponível
                                  </p>
                                  <p className="truncate text-[27px] font-black tracking-tight drop-shadow-sm sm:text-[32px]">
                                    {(cartao.saldoPrivado ?? true)
                                      ? "R$ •••••"
                                      : `R$ ${Number(cartao.saldo.replace(",", ".")) || 0}`}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  aria-label={
                                    (cartao.saldoPrivado ?? true)
                                      ? "Mostrar saldo"
                                      : "Ocultar saldo"
                                  }
                                  className="mb-1 shrink-0 rounded-full border border-white/30 bg-black/10 p-2 text-white/90 shadow-sm transition hover:bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    alternarSaldoPrivado(cartao.id);
                                  }}
                                >
                                  {(cartao.saldoPrivado ?? true) ? (
                                    <EyeOff className="size-4" />
                                  ) : (
                                    <Eye className="size-4" />
                                  )}
                                </button>
                              </div>
                              <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/65">
                                <span>•••• &nbsp;•••• &nbsp;••••</span>
                                <span>
                                  Atualizado em {new Date().toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {cartaoAcoesId === cartao.id ? (
                          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[24px] bg-slate-950/10 p-4 animate-in fade-in duration-200">
                            <div
                              className="grid w-full max-w-[280px] grid-cols-2 gap-3 rounded-2xl border border-white/60 bg-white/90 p-3 text-slate-800 shadow-2xl backdrop-blur-xl"
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  abrirEdicaoCartao(cartao);
                                }}
                                  className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl bg-brand-soft px-3 py-3 text-sm font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              >
                                <Pencil className="size-5" aria-hidden="true" />
                                Editar cartão
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (
                                    confirmarAcaoSensivel(
                                      `Deseja deletar o cartão “${getNomeCartaoExibicao(cartao.nome)}”?`,
                                    )
                                  ) {
                                    void removerCartao(cartao.id);
                                  }
                                }}
                                className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                              >
                                <Trash2 className="size-5" aria-hidden="true" />
                                Deletar cartão
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    aria-label="Adicionar cartão novo"
                    onClick={abrirCriacaoCartao}
                    className="flex min-h-[244px] w-full shrink-0 snap-center flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed border-primary/35 bg-brand-soft/50 px-6 text-center text-primary transition-[transform,border-color,background-color,box-shadow] duration-300 hover:scale-[1.01] hover:border-primary hover:bg-white hover:shadow-lg hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <span className="flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-white text-primary shadow-sm transition-transform duration-300 hover:rotate-90">
                      <Plus className="size-8" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-lg font-extrabold text-primary">
                        Adicionar cartão
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        Deslize após o último cartão para adicionar outro
                      </span>
                    </span>
                  </button>
                </div>
              </div>
              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-3 rounded-[14px] bg-[#f7faff] p-1">
                  {[
                    {
                      key: "calendar",
                      label: "Calendário",
                      icon: <CalendarDays className="size-4" aria-hidden="true" />,
                      active: false,
                    },
                    {
                      key: "history",
                      label: "Histórico de uso",
                      icon: <History className="size-4" aria-hidden="true" />,
                      active: false,
                    },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      aria-label={item.label}
                      title={item.label}
                      onClick={() => abrirPagina(item.key as "calendar" | "history")}
                      className={`flex h-11 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${item.active ? "border-primary bg-primary text-white shadow-sm" : "border-[#dfe9f5] bg-white text-primary hover:border-primary/40"}`}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Custo por dia
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {saldoPrivadoAtivo ? "R$ •••••" : brl(calc.custoDia)}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Resumo
                </p>
                <div className="mt-3 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total usado</span>
                    <strong className="font-semibold text-slate-700">
                      {saldoPrivadoAtivo ? "R$ •••••" : brl(calc.totalGasto)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Sobra</span>
                    <strong className="font-semibold text-slate-700">
                      {saldoPrivadoAtivo ? "R$ •••••" : brl(calc.sobra)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground">Recarga vence</span>
                    <strong className="font-semibold text-slate-700">
                      {saldoPrivadoAtivo
                        ? "••/••/••••"
                        : calc.recarga
                        ? new Date(
                            `${calc.recarga}T00:00:00`,
                          ).toLocaleDateString("pt-BR")
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-4 pb-6 pt-4">
        {page === "profile" && session ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <UserRound className="size-7" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Meu perfil
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-extrabold text-primary">
                    {formatarNomeCompleto(session.firstName)}
                  </h2>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <h3 className="font-bold text-primary">Informações da conta</h3>
              <dl className="mt-4 divide-y divide-slate-100">
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-sm text-muted-foreground">Nome</dt>
                  <dd className="break-words text-sm font-semibold text-[#0b1f33] sm:text-right">
                    {formatarNomeCompleto(session.firstName)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-sm text-muted-foreground">Email</dt>
                  <dd className="break-all text-sm font-semibold text-[#0b1f33] sm:text-right">
                    {session.email}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-sm text-muted-foreground">Celular</dt>
                  <dd className="text-sm font-semibold text-[#0b1f33] sm:text-right">
                    {formatarCelular(session.celular) || "Não informado"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-sm text-muted-foreground">Tipo de conta</dt>
                  <dd className="text-sm font-semibold text-[#0b1f33] sm:text-right">
                    {session.role === "admin" ? "Administrador" : "Usuário"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <dt className="text-sm text-muted-foreground">Manter conectado</dt>
                  <dd className="text-sm font-semibold text-[#0b1f33] sm:text-right">
                    {session.rememberMe ? "Até 30 dias" : "Até 24 horas"}
                  </dd>
                </div>
              </dl>
            </div>
            <button
              type="button"
              onClick={sairDaConta}
              className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-red-200 bg-white px-4 py-3.5 text-sm font-bold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Sair da conta
            </button>
          </section>
        ) : null}

        {page === "calendar" ? (
          <section className="w-full">
            <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Visão mensal
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold capitalize tracking-tight text-primary">
                    {MESES[mesRef.getMonth()]}
                    <span className="ml-2 font-semibold text-slate-400">
                      {mesRef.getFullYear()}
                    </span>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setMesRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
                    }
                    className="h-9 rounded-xl px-3 text-xs font-bold"
                  >
                    Hoje
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => mudarMes(-1)}
                    aria-label="Mês anterior"
                    className="size-9 rounded-xl"
                  >
                    <ChevronLeft className="size-4 text-primary" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => mudarMes(1)}
                    aria-label="Próximo mês"
                    className="size-9 rounded-xl"
                  >
                    <ChevronRight className="size-4 text-primary" />
                  </Button>
                </div>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center sm:gap-2">
                {DIAS.map((dia, i) => (
                  <div
                    key={`${dia}-${i}`}
                    className="py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:text-xs"
                  >
                    {dia}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                {grade.map((d, i) => {
                  if (!d) return <div key={`vazio-${i}`} />;
                  const key = iso(d);
                  const fds = d.getDay() === 0 || d.getDay() === 6;
                  const coberto = calc.cobertos.has(key);
                  const recarga = calc.recarga === key;
                  const hoje = key === iso(new Date());
                  const estilo = recarga
                    ? "border-brand-warm bg-brand-warm font-extrabold text-brand-warm-foreground shadow-md shadow-brand-warm/20"
                    : coberto
                      ? "border-primary bg-primary font-bold text-primary-foreground shadow-sm shadow-primary/20"
                      : fds
                        ? "border-transparent bg-slate-50 text-slate-300"
                        : "border-slate-100 bg-white font-medium text-slate-700 hover:border-primary/30 hover:bg-brand-soft/50";
                  return (
                    <div
                      key={key}
                      title={
                        recarga
                          ? "Dia previsto para recarga"
                          : coberto
                            ? "Dia coberto pelo saldo"
                            : fds
                              ? "Fim de semana"
                              : undefined
                      }
                      aria-label={`${d.getDate()} de ${MESES[d.getMonth()]}${recarga ? ", dia previsto para recarga" : coberto ? ", dia coberto pelo saldo" : fds ? ", fim de semana" : ""}`}
                      aria-current={hoje ? "date" : undefined}
                      className={`relative flex aspect-square min-h-9 items-center justify-center rounded-xl border text-xs transition-all duration-200 sm:rounded-2xl sm:text-sm ${estilo} ${hoje && !recarga && !coberto ? "ring-2 ring-primary/50 ring-offset-1" : ""}`}
                    >
                      {d.getDate()}
                      {hoje ? (
                        <span className="absolute bottom-1 size-1 rounded-full bg-current opacity-70 sm:bottom-1.5" />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-100 pt-5 text-xs font-medium text-slate-600">
                <Legenda cor="bg-primary" texto="Dia coberto pelo saldo" />
                <Legenda cor="bg-brand-warm" texto="Dia previsto para recarga" />
                <span className="flex items-center gap-2">
                  <span className="inline-flex size-3 rounded-full border-2 border-primary/50" />
                  Hoje
                </span>
              </div>
            </section>
          </section>
        ) : null}

        {page === "history" ? (
          <section className="mx-auto max-w-4xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Cartão selecionado
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-extrabold text-primary">
                    Histórico de uso
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {cartoes.find((item) => item.id === cartaoAtivoId)?.nome ?? "Cartão principal"}
                  </p>
                </div>
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <History className="size-6" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[20px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Dias utilizados
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#0b1f33]">
                  {historicoUso.diasUteis}
                </p>
              </div>
              <div className="rounded-[20px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Gasto estimado
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#0b1f33]">
                  {brl(historicoUso.totalGasto)}
                </p>
              </div>
              <div className="rounded-[20px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Saldo estimado
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#0b1f33]">
                  {brl(historicoUso.saldoRestante)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <span className="mt-0.5 shrink-0 font-black" aria-hidden="true">i</span>
              <p>
                Este é um histórico estimado com base na recarga, tarifa, viagens por dia e data inicial informadas. O app não recebe transações reais do RioCard.
              </p>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-[#dfe9f5] bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                <h3 className="font-bold text-primary">Dias cobertos pelo saldo</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Exibindo até os 20 dias úteis mais recentes.
                </p>
              </div>
              {historicoUso.registros.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {historicoUso.registros.map((registro) => (
                    <li
                      key={registro.data}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0b1f33]">
                          {new Date(`${registro.data}T00:00:00`).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {viagens} {Number(viagens) === 1 ? "passagem prevista" : "passagens previstas"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#0b1f33]">−{brl(registro.gasto)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Saldo estimado: {brl(registro.saldoApos)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center sm:px-6">
                  <CalendarDays className="mx-auto size-8 text-primary/35" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-primary">Ainda não há dias cobertos</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Confira o saldo e a data inicial do cartão para calcular o histórico estimado.
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {page === "card-themes" ? (
          <section className="mx-auto max-w-4xl space-y-4 pb-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <Palette className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Personalização do cartão
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Temas do cartão
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha uma cor padrão ou um tema decorativo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#dfe9f5] bg-white p-1.5 shadow-sm">
              <button
                type="button"
                role="tab"
                aria-selected={abaTemasCartao === "standard"}
                onClick={() => setAbaTemasCartao("standard")}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${abaTemasCartao === "standard" ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-brand-soft hover:text-primary"}`}
              >
                Cor padrão <span className="ml-1 opacity-75">(6)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={abaTemasCartao === "decorative"}
                onClick={() => setAbaTemasCartao("decorative")}
                className={`rounded-xl px-3 py-2.5 text-sm font-bold transition ${abaTemasCartao === "decorative" ? "bg-primary text-primary-foreground shadow-sm" : "text-slate-600 hover:bg-brand-soft hover:text-primary"}`}
              >
                Decorativos <span className="ml-1 opacity-75">(24)</span>
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(CARD_THEMES) as CardColorKey[])
                .filter((key) =>
                  abaTemasCartao === "standard"
                    ? CARD_THEMES[key].decoration === null
                    : CARD_THEMES[key].decoration !== null,
                )
                .map((key) => {
                const theme = CARD_THEMES[key];
                const selected = novoCartaoCor === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Usar tema ${theme.name}`}
                    onClick={() => selecionarTemaCartao(key)}
                    className={`group rounded-[22px] border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-4 ${selected ? "border-primary ring-2 ring-primary/20" : "border-[#dfe9f5] hover:border-primary/40"}`}
                  >
                    <CardThemePreview themeKey={key} />
                    <span className="mt-3 flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-primary">
                          {theme.name}
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {CARD_THEME_DESCRIPTIONS[key]}
                        </span>
                      </span>
                      {selected ? (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {page === "edit-card" ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <Pencil className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Cartão
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Editar cartão
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Atualize os dados e o planejamento deste cartão.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(event) => void criarNovoCartao(event)}
              className="space-y-4 rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6"
            >
              <Campo label="Nome do cartão">
                <input
                  required
                  maxLength={40}
                  type="text"
                  value={novoCartaoNome}
                  onChange={(event) => setNovoCartaoNome(event.target.value)}
                  placeholder="Ex.: Cartão principal"
                  className="field"
                />
              </Campo>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Tema decorativo
                </p>
                <button
                  type="button"
                  onClick={() => abrirTemasDoCartao("edit-card")}
                  aria-label={`Selecionar tema decorativo. Tema atual: ${CARD_THEMES[novoCartaoCor].name}`}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 text-left transition hover:border-primary/40 hover:bg-brand-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-32 shrink-0">
                    <CardThemePreview themeKey={novoCartaoCor} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-primary">
                      {CARD_THEMES[novoCartaoCor].name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Toque para escolher outro tema
                    </span>
                  </span>
                  <ChevronRight className="mr-2 size-5 shrink-0 text-primary/70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Valor da recarga (R$)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={novoCartaoSaldo}
                    onChange={(event) => setNovoCartaoSaldo(event.target.value)}
                    className="field"
                  />
                </Campo>
                <Campo label="Valor de cada passagem (R$)">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={novoCartaoTarifa}
                    onChange={(event) => setNovoCartaoTarifa(event.target.value)}
                    className="field"
                  />
                </Campo>
                <Campo label="Passagens por dia">
                  <select
                    value={novoCartaoViagens}
                    onChange={(event) => setNovoCartaoViagens(event.target.value)}
                    className="field"
                  >
                    <option value="1">1 (só ida)</option>
                    <option value="2">2 (ida e volta)</option>
                    <option value="3">3 passagens</option>
                    <option value="4">4 (2 ônibus por trecho)</option>
                  </select>
                </Campo>
                <Campo label="Começar a contar a partir de">
                  <input
                    required
                    type="date"
                    value={novoCartaoInicio}
                    onChange={(event) => setNovoCartaoInicio(event.target.value)}
                    className="field"
                  />
                </Campo>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={salvandoNovoCartao}
                className="w-full rounded-xl font-bold shadow-lg shadow-primary/20 transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {salvandoNovoCartao ? "Salvando alterações..." : "Salvar alterações"}
              </Button>
            </form>
          </section>
        ) : null}

        {page === "settings" ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Configurações
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-primary">
                Personalize seu app
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha como as cores do RioCard Planner aparecem para você.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirDadosDaConta}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <UserRound className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-primary">
                  Dados da conta
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Edite seu nome, email e celular
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => abrirPagina("security")}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <ShieldCheck className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-primary">Segurança</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Confirmações para ações sensíveis e proteção da sessão
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => abrirPagina("appearance")}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <Palette className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-primary">
                  Aparência do app
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  10 temas de cores · atual: {APP_THEMES[temaAparencia].name}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => abrirPagina("accessibility")}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <Eye className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-primary">Acessibilidade</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Tamanho do texto e contraste
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>
          </section>
        ) : null}

        {page === "accessibility" ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <Eye className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Preferências visuais
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Acessibilidade
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajuste a leitura para ficar mais confortável.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <h3 className="font-bold text-primary">Tamanho do texto</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A alteração é aplicada imediatamente em todo o aplicativo.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {([
                  ["normal", "Padrão", "Aa"],
                  ["large", "Grande", "Aa"],
                  ["larger", "Maior", "Aa"],
                ] as const).map(([size, label, sample]) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={acessibilidade.textSize === size}
                    disabled={acessibilidadeSalvando}
                    onClick={() =>
                      void atualizarAcessibilidade({
                        ...acessibilidade,
                        textSize: size,
                      })
                    }
                    className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${acessibilidade.textSize === size ? "border-primary bg-brand-soft text-primary ring-2 ring-primary/20" : "border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50"}`}
                  >
                    <span
                      className={`font-bold ${size === "normal" ? "text-base" : size === "large" ? "text-lg" : "text-xl"}`}
                      aria-hidden="true"
                    >
                      {sample}
                    </span>
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-primary">Alto contraste</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reforce o contraste de textos secundários e bordas.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={acessibilidade.highContrast}
                  aria-label="Ativar alto contraste"
                  disabled={acessibilidadeSalvando}
                  onClick={() =>
                    void atualizarAcessibilidade({
                      ...acessibilidade,
                      highContrast: !acessibilidade.highContrast,
                    })
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ${acessibilidade.highContrast ? "border-primary bg-primary" : "border-slate-300 bg-slate-200"} ${acessibilidadeSalvando ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${acessibilidade.highContrast ? "translate-x-6" : "translate-x-1"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">
                {acessibilidadeSalvando
                  ? "Salvando preferências…"
                  : acessibilidade.highContrast
                    ? "Alto contraste ativado."
                    : "Alto contraste desativado."}
              </p>
            </div>
          </section>
        ) : null}

        {page === "account-data" && session ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Minha conta
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Dados da conta
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Atualize as informações usadas no seu perfil.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={(event) => void salvarDadosDaConta(event)}
              className="space-y-4 rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6"
            >
              <Campo label="Nome completo">
                <input
                  required
                  maxLength={120}
                  type="text"
                  autoComplete="name"
                  value={dadosContaNome}
                  onChange={(event) => setDadosContaNome(event.target.value)}
                  placeholder="Seu nome completo"
                  className="field"
                />
              </Campo>
              <Campo label="Email">
                <input
                  required
                  maxLength={254}
                  type="email"
                  autoComplete="email"
                  value={dadosContaEmail}
                  onChange={(event) => setDadosContaEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="field"
                />
              </Campo>
              <Campo label="Celular">
                <input
                  required
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  value={dadosContaCelular}
                  onChange={(event) =>
                    setDadosContaCelular(formatarCelular(event.target.value))
                  }
                  placeholder="(00) 00000-0000"
                  className="field"
                />
              </Campo>

              {dadosContaErro ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {dadosContaErro}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                disabled={dadosContaSalvando}
                className="w-full rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {dadosContaSalvando ? "Salvando dados..." : "Salvar alterações"}
              </Button>
            </form>
          </section>
        ) : null}

        {page === "security" ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Segurança
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Proteção da conta
                  </h2>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-primary">
                    Confirmação antes de ações sensíveis
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Exige confirmação antes de excluir cartões ou contas administrativas.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={confirmarAcoesSensiveis}
                  aria-label="Alternar confirmação de ações sensíveis"
                  disabled={segurancaSalvando || !session}
                  onClick={() => void atualizarSeguranca(!confirmarAcoesSensiveis)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 ${confirmarAcoesSensiveis ? "border-primary bg-primary" : "border-slate-300 bg-slate-200"} ${segurancaSalvando || !session ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${confirmarAcoesSensiveis ? "translate-x-6" : "translate-x-1"}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {segurancaSalvando
                  ? "Salvando ajuste de segurança…"
                  : session
                    ? confirmarAcoesSensiveis
                      ? "A confirmação está ativa."
                      : "A confirmação está desativada."
                    : "Faça login para salvar essa preferência."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirPagina("reset-password")}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <KeyRound className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-primary">
                  Redefinir senha
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Atualize sua senha com confirmação para manter o acesso seguro.
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-primary/50 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>
          </section>
        ) : null}

        {page === "reset-password" ? (
          <section className="mx-auto max-w-xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Segurança
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Redefinir senha
                  </h2>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                  <KeyRound className="size-5" aria-hidden="true" />
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <form onSubmit={(event) => void redefinirSenha(event)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="senha-atual" className="text-sm font-medium text-slate-700">
                    Senha atual
                  </label>
                  <input
                    id="senha-atual"
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => setSenhaAtual(event.target.value)}
                    placeholder="Digite sua senha atual"
                    className="field w-full"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nova-senha" className="text-sm font-medium text-slate-700">
                    Nova senha
                  </label>
                  <input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(event) => setNovaSenha(event.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className="field w-full"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmacao-nova-senha" className="text-sm font-medium text-slate-700">
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirmacao-nova-senha"
                    type="password"
                    value={confirmacaoNovaSenha}
                    onChange={(event) => setConfirmacaoNovaSenha(event.target.value)}
                    placeholder="Repita a nova senha"
                    className="field w-full"
                    autoComplete="new-password"
                  />
                </div>

                {senhaResetError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {senhaResetError}
                  </p>
                ) : null}
                {senhaResetSuccess ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {senhaResetSuccess}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={senhaResetLoading || !session}
                >
                  {senhaResetLoading ? "Atualizando senha…" : "Salvar nova senha"}
                </Button>
              </form>
            </div>
          </section>
        ) : null}

        {page === "appearance" ? (
          <section className="mx-auto max-w-4xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Personalização
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-primary">
                    Aparência do app
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Selecione um tema. Sua escolha será salva na sua conta.
                  </p>
                </div>
                <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-primary">
                  Tema ativo: {APP_THEMES[temaAparencia].name}
                </span>
              </div>
            </div>

            {!dadosUsuarioCarregados ? (
              <div className="rounded-2xl border border-[#dfe9f5] bg-white p-4 text-center text-sm text-muted-foreground shadow-sm sm:p-6">
                Carregando suas preferências salvas…
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(APP_THEMES) as AppThemeKey[]).map((chave) => {
                  const tema = APP_THEMES[chave];
                  const selecionado = temaAparencia === chave;
                  return (
                    <button
                      key={chave}
                      type="button"
                      aria-pressed={selecionado}
                      disabled={temaSalvando !== null}
                      onClick={() => void selecionarTemaAparencia(chave)}
                      className={`group rounded-[20px] border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-70 ${selecionado ? "border-primary bg-brand-soft/50 ring-2 ring-primary/20" : "border-slate-200 bg-white hover:border-primary/40"}`}
                    >
                      <span
                        className="relative block h-24 overflow-hidden rounded-[14px] p-3 text-white shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${tema.from} 0%, ${tema.to} 100%)`,
                        }}
                      >
                        <span className="flex items-center justify-between text-[10px] font-bold">
                          <span>RioCard Mais</span>
                          <span className="size-3 rounded-full border border-white/70 bg-white/20" />
                        </span>
                        <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                          <span className="h-5 w-7 rounded-md border border-white/50 bg-white/70" />
                          <span className="h-7 w-16 rounded-t-lg border border-white/45 bg-white/20" />
                        </span>
                      </span>
                      <span className="mt-3 flex items-center gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-primary">
                            {tema.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {tema.description}
                          </span>
                        </span>
                        {selecionado ? (
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-3 flex gap-1.5" aria-hidden="true">
                        {[tema.primary, tema.soft, tema.accent].map((cor) => (
                          <span
                            key={cor}
                            className="h-1.5 flex-1 rounded-full"
                            style={{ backgroundColor: cor }}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p aria-live="polite" className="text-center text-xs text-muted-foreground">
              {temaSalvando
                ? `Salvando tema ${APP_THEMES[temaSalvando].name}…`
                : "A seleção é salva automaticamente na sua conta."}
            </p>
          </section>
        ) : null}
        </div>
      </div>

      {novoCartaoAberto && page !== "card-themes" ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !salvandoNovoCartao
            ) {
              setNovoCartaoAberto(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="novo-cartao-titulo"
            className="my-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.3)] animate-in zoom-in-95 slide-in-from-bottom-3 duration-300"
          >
            <div
              className="relative overflow-hidden px-6 pb-6 pt-5 text-white sm:px-8"
              style={{
                background: `linear-gradient(135deg, ${temaApp.from}, ${temaApp.to})`,
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-16 size-48 rounded-full border border-white/15"
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner">
                    <WalletCards className="size-5" aria-hidden="true" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                    {novoCartaoIdEditando ? "Editar cartão" : "Novo cartão"}
                  </p>
                  <h2
                    id="novo-cartao-titulo"
                    className="mt-1 text-2xl font-extrabold tracking-tight"
                  >
                    {novoCartaoIdEditando
                      ? "Editar informações"
                      : "Adicionar cartão"}
                  </h2>
                  <p className="mt-1 text-sm text-white/75">
                    {novoCartaoIdEditando
                      ? "Atualize os dados deste cartão."
                      : "Preencha os dados para calcular seu saldo e suas viagens."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Fechar criação de cartão"
                  disabled={salvandoNovoCartao}
                  onClick={() => setNovoCartaoAberto(false)}
                  className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:rotate-90 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => void criarNovoCartao(event)}
              className="max-h-[calc(90dvh-8.5rem)] space-y-5 overflow-y-auto p-5 sm:p-8"
            >
              <Campo label="Nome do cartão">
                <input
                  required
                  maxLength={40}
                  type="text"
                  value={novoCartaoNome}
                  onChange={(event) => setNovoCartaoNome(event.target.value)}
                  placeholder="Ex.: Cartão principal"
                  className="field"
                />
              </Campo>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Tema decorativo
                </p>
                <button
                  type="button"
                  onClick={() => abrirTemasDoCartao("home")}
                  aria-label={`Selecionar tema decorativo. Tema atual: ${CARD_THEMES[novoCartaoCor].name}`}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 text-left transition hover:border-primary/40 hover:bg-brand-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="w-32 shrink-0">
                    <CardThemePreview themeKey={novoCartaoCor} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-primary">
                      {CARD_THEMES[novoCartaoCor].name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Toque para escolher outro tema
                    </span>
                  </span>
                  <ChevronRight className="mr-2 size-5 shrink-0 text-primary/70 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Valor da recarga (R$)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={novoCartaoSaldo}
                    onChange={(event) => setNovoCartaoSaldo(event.target.value)}
                    className="field"
                  />
                </Campo>
                <Campo label="Valor de cada passagem (R$)">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={novoCartaoTarifa}
                    onChange={(event) => setNovoCartaoTarifa(event.target.value)}
                    className="field"
                  />
                </Campo>
                <Campo label="Passagens por dia">
                  <select
                    value={novoCartaoViagens}
                    onChange={(event) => setNovoCartaoViagens(event.target.value)}
                    className="field"
                  >
                    <option value="1">1 (só ida)</option>
                    <option value="2">2 (ida e volta)</option>
                    <option value="3">3 passagens</option>
                    <option value="4">4 (2 ônibus por trecho)</option>
                  </select>
                </Campo>
                <Campo label="Começar a contar a partir de">
                  <input
                    required
                    type="date"
                    value={novoCartaoInicio}
                    onChange={(event) => setNovoCartaoInicio(event.target.value)}
                    className="field"
                  />
                </Campo>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={salvandoNovoCartao}
                className="w-full rounded-xl font-bold shadow-lg shadow-primary/20 transition-transform duration-200 hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {salvandoNovoCartao
                  ? novoCartaoIdEditando
                    ? "Salvando alterações..."
                    : "Criando cartão..."
                  : novoCartaoIdEditando
                    ? "Salvar alterações"
                    : "Criar cartão"}
              </Button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Linha({
  rotulo,
  valor,
  inverse = false,
}: {
  rotulo: string;
  valor: string;
  inverse?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          inverse ? "text-primary-foreground/65" : "text-muted-foreground"
        }
      >
        {rotulo}
      </span>
      <span className="font-bold">{valor}</span>
    </div>
  );
}

function Destaque({
  titulo,
  valor,
  tom,
}: {
  titulo: string;
  valor: string;
  tom: "azul" | "quente";
}) {
  return (
    <div
      className={`rounded-md border-l-4 bg-card p-5 shadow-sm ${tom === "quente" ? "border-brand-warm" : "border-primary"}`}
    >
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {titulo}
      </p>
      <p className="mt-2 text-lg font-extrabold capitalize text-foreground md:text-xl">
        {valor}
      </p>
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block size-3 rounded-xs ${cor}`} />
      {texto}
    </span>
  );
}
