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
  House,
  LogOut,
  Menu,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
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
  },
  rosa: {
    name: "Rosa",
    from: "#ff5db1",
    via: "#ff2a8e",
    to: "#d8006d",
    glow: "rgba(255, 0, 140, 0.35)",
  },
  verde: {
    name: "Verde",
    from: "#27c77d",
    via: "#1ead6c",
    to: "#0f8f53",
    glow: "rgba(22, 163, 74, 0.35)",
  },
  roxo: {
    name: "Roxo",
    from: "#8b5cf6",
    via: "#7c3aed",
    to: "#5b2ecf",
    glow: "rgba(124, 58, 237, 0.35)",
  },
  laranja: {
    name: "Laranja",
    from: "#ff9f43",
    via: "#ff8a3d",
    to: "#e66a00",
    glow: "rgba(234, 88, 12, 0.35)",
  },
  cinza: {
    name: "Cinza",
    from: "#667085",
    via: "#475467",
    to: "#344054",
    glow: "rgba(71, 84, 103, 0.35)",
  },
} as const;

type CardColorKey = keyof typeof CARD_THEMES;

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
type AppPage = "home" | "calendar" | "settings" | "appearance" | "admin";
const DEFAULT_APP_THEME: AppThemeKey = "oceano";

type Account = {
  id: string;
  firstName: string;
  email: string;
  celular: string;
  role: "client" | "admin";
  rememberMe?: boolean;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  celular: string;
  role: "client" | "admin";
  created_at: string;
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
};

const getCardTheme = (cor?: string) => {
  const key = cor && cor in CARD_THEMES ? (cor as CardColorKey) : "azul";
  return CARD_THEMES[key];
};

const getNomeCartaoExibicao = (nome?: string) =>
  (nome ?? "").trim() || "Cartão";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mesRef, setMesRef] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  );
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [cartaoAtivoId, setCartaoAtivoId] = useState<string | null>(null);
  const [temaAparencia, setTemaAparencia] =
    useState<AppThemeKey>(DEFAULT_APP_THEME);
  const [authVerificando, setAuthVerificando] = useState(true);
  const [dadosUsuarioCarregados, setDadosUsuarioCarregados] = useState(false);
  const [temaSalvando, setTemaSalvando] = useState<AppThemeKey | null>(null);
  const [cartaoAcoesId, setCartaoAcoesId] = useState<string | null>(null);
  const [novoCartaoAberto, setNovoCartaoAberto] = useState(false);
  const [novoCartaoIdEditando, setNovoCartaoIdEditando] = useState<string | null>(null);
  const [novoCartaoNome, setNovoCartaoNome] = useState("");
  const [novoCartaoCor, setNovoCartaoCor] = useState<CardColorKey>("azul");
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
  const [authError, setAuthError] = useState("");
  const [celularEmUso, setCelularEmUso] = useState(false);
  const [emailEmUso, setEmailEmUso] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminBusca, setAdminBusca] = useState("");
  const [adminFiltro, setAdminFiltro] = useState<"all" | "client" | "admin">(
    "all",
  );
  const [adminAcaoId, setAdminAcaoId] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const carouselInicializadoRef = useRef(false);
  const pressaoCartaoTimerRef = useRef<number | null>(null);
  const pressaoCartaoInicioRef = useRef<{ x: number; y: number } | null>(null);
  const ignorarClickAposPressaoRef = useRef(false);
  const dadosUsuarioRequestRef = useRef(0);
  const temaApp = APP_THEMES[temaAparencia];
  const homeMenuBackground = `linear-gradient(110deg, ${temaApp.from}, ${temaApp.to})`;
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
    if (!menuOpen) return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (pressaoCartaoTimerRef.current !== null) {
        window.clearTimeout(pressaoCartaoTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!novoCartaoAberto) return;

    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !salvandoNovoCartao) {
        setNovoCartaoAberto(false);
      }
    };

    window.addEventListener("keydown", fecharComEscape);
    return () => window.removeEventListener("keydown", fecharComEscape);
  }, [novoCartaoAberto, salvandoNovoCartao]);

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
            cor:
              typeof card.cor === "string" && card.cor in CARD_THEMES
                ? (card.cor as CardColorKey)
                : "azul",
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
      setSaldo("100");
      setTarifa("4.70");
      setViagens("2");
      setInicio(iso(hoje));
      return;
    }
    setDadosUsuarioCarregados(false);
    setTemaAparencia(DEFAULT_APP_THEME);
    setCartoes([]);
    setCartaoAtivoId(null);
    setSaldo("100");
    setTarifa("4.70");
    setViagens("2");
    setInicio(iso(hoje));
    void carregarDadosDoUsuario(session);
  }, [carregarDadosDoUsuario, session, hoje]);

  const carregarUsuariosAdmin = useCallback(async () => {
    setAdminLoading(true);
    try {
      const result = await apiRequest<{ users: AdminUser[] }>("/admin/users");
      setAdminUsers(
        result.users.map((usuario) => ({
          ...usuario,
          id: String(usuario.id),
          created_at: String(usuario.created_at),
        })),
      );
      setAdminError("");
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar usuários.",
      );
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    if (page === "admin" && session?.role === "admin")
      void carregarUsuariosAdmin();
  }, [carregarUsuariosAdmin, page, session]);

  const atualizarRoleUsuario = async (
    usuario: AdminUser,
    role: AdminUser["role"],
  ) => {
    if (usuario.id === session?.id) {
      toast.error("Não é possível alterar sua própria permissão de administrador.");
      return;
    }

    setAdminAcaoId(usuario.id);
    try {
      await apiRequest(`/admin/users/${usuario.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: usuario.name,
          email: usuario.email,
          celular: usuario.celular,
          role,
        }),
      });
      await carregarUsuariosAdmin();
      toast.success("Permissão atualizada.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a permissão.",
      );
    } finally {
      setAdminAcaoId(null);
    }
  };

  const excluirUsuarioAdmin = async (usuario: AdminUser) => {
    if (usuario.id === session?.id) {
      toast.error("Não é permitido excluir sua própria conta administrativa.");
      return;
    }
    if (!window.confirm(`Excluir a conta de ${usuario.name}?`)) return;
    setAdminAcaoId(usuario.id);
    try {
      await apiRequest(`/admin/users/${usuario.id}`, { method: "DELETE" });
      await carregarUsuariosAdmin();
      toast.success("Conta removida.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta.",
      );
    } finally {
      setAdminAcaoId(null);
    }
  };

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
    setPage(novaPagina);
    setMenuOpen(false);
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
    setNovoCartaoAberto(true);
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
          },
        }),
      });

      setCartoes(cartoesAtualizados);
      setCartaoAtivoId(novoAtivoId);
      if (!cartaoEditado || novoAtivoId === cartaoSalvo.id) {
        aplicarCartaoAtivo(cartaoSalvo);
      }
      setPage("home");
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
    setMenuOpen(false);
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

  const usuariosAdminFiltrados = useMemo(() => {
    const termo = adminBusca.trim().toLocaleLowerCase("pt-BR");
    return adminUsers.filter((usuario) => {
      if (adminFiltro !== "all" && usuario.role !== adminFiltro) return false;
      if (!termo) return true;
      return [usuario.name, usuario.email, usuario.celular]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);
    });
  }, [adminBusca, adminFiltro, adminUsers]);

  const adminResumo = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
    );
    const inicio30Dias = new Date(inicioHoje);
    inicio30Dias.setDate(inicio30Dias.getDate() - 29);
    const ultimosSeteDias = Array.from({ length: 7 }, (_, index) => {
      const dia = new Date(inicioHoje);
      dia.setDate(dia.getDate() - (6 - index));
      return {
        data: dia,
        total: 0,
      };
    });

    let novos30Dias = 0;
    for (const usuario of adminUsers) {
      const criadoEm = new Date(usuario.created_at);
      if (Number.isNaN(criadoEm.getTime())) continue;
      if (criadoEm >= inicio30Dias && criadoEm <= agora) novos30Dias++;

      const diaIndice = ultimosSeteDias.findIndex(
        ({ data }) =>
          data.getFullYear() === criadoEm.getFullYear() &&
          data.getMonth() === criadoEm.getMonth() &&
          data.getDate() === criadoEm.getDate(),
      );
      if (diaIndice >= 0) ultimosSeteDias[diaIndice]!.total++;
    }

    return {
      total: adminUsers.length,
      clientes: adminUsers.filter((usuario) => usuario.role === "client")
        .length,
      administradores: adminUsers.filter((usuario) => usuario.role === "admin")
        .length,
      novos30Dias,
      ultimosSeteDias,
      maximoGrafico: Math.max(1, ...ultimosSeteDias.map((dia) => dia.total)),
    };
  }, [adminUsers]);

  if (authVerificando || (session && !dadosUsuarioCarregados)) {
    return (
      <main
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f6fb] px-5 py-10"
        aria-busy="true"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 -top-32 size-80 rounded-full bg-blue-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-28 size-80 rounded-full bg-pink-200/35 blur-3xl"
        />
        <section
          role="status"
          aria-live="polite"
          className="relative w-full max-w-md rounded-[28px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(28,55,90,0.14)] backdrop-blur-xl sm:p-10"
        >
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-[22px] text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${temaApp.from}, ${temaApp.to})`,
            }}
          >
            <WalletCards className="size-7" aria-hidden="true" />
          </div>
          <div className="mx-auto mt-6 flex size-9 items-center justify-center rounded-full bg-brand-soft text-primary">
            <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
            RioCard Planner
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0b1f33]">
            Preparando seu aplicativo
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {session
              ? `Estamos carregando os cartões e as preferências de ${session.firstName}.`
              : "Estamos verificando sua sessão e preparando seus dados."}
          </p>
          <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full w-1/3 animate-pulse rounded-full"
              style={{ backgroundColor: temaApp.primary }}
            />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            Isso pode levar alguns instantes.
          </p>
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
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Voltar ao login
                  </button>
                ) : null}
                {authMode === "register" ? (
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0b1f33]">
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
                      Primeiro nome
                    </span>
                    <input
                      type="text"
                      autoComplete="given-name"
                      value={cadastroNome}
                      onChange={(e) => setCadastroNome(e.target.value)}
                      placeholder="Seu nome"
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
        className={`mx-auto min-h-screen overflow-hidden shadow-none ${page === "admin" ? "max-w-7xl" : page === "calendar" ? "max-w-5xl" : "max-w-md"}`}
        style={{
          background:
            page === "home" ? homeMenuBackground : temaApp.background,
        }}
      >
        <header
          className="px-4 pb-4 pt-3 text-white"
          style={{
            background: `linear-gradient(110deg, ${temaApp.from}, ${temaApp.to})`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
              aria-expanded={menuOpen}
              aria-controls="menu-lateral"
              className="h-10 w-10 rounded-full border border-white/15 bg-white/10 text-white shadow-sm transition-all duration-200 hover:rotate-90 hover:bg-white/20"
            >
              <Menu aria-hidden="true" />
            </Button>

            <div className="flex-1" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {inicialUsuario}
            </div>
          </div>
        </header>

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
              className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 transition-all duration-200 hover:rotate-90 hover:bg-slate-200 hover:text-slate-900"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div
            className="relative mb-7 overflow-hidden rounded-2xl p-4 text-white shadow-lg shadow-black/10"
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
                <p className="truncate text-base font-bold">{session.firstName}</p>
                <p className="truncate text-xs text-white/75">{session.email}</p>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
              <span>{session.role === "admin" ? "Administrador" : "Conta RioCard Mais"}</span>
              <span>{session.rememberMe ? "Sessão de 30 dias" : "Sessão de 24 horas"}</span>
            </div>
          </div>

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
              <House className="size-[18px]" aria-hidden="true" />
              <span className="flex-1">Início</span>
              <ChevronRight className={`size-4 transition-transform duration-200 ${page === "home" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current={page === "calendar" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "calendar" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("calendar")}
            >
              <CalendarDays className="size-[18px]" aria-hidden="true" />
              <span className="flex-1">Ver calendário</span>
              <ChevronRight className={`size-4 transition-transform duration-200 ${page === "calendar" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-current={page === "settings" ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "settings" || page === "appearance" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
              onClick={() => abrirPagina("settings")}
            >
              <WalletCards className="size-[18px]" aria-hidden="true" />
              <span className="flex-1">Configurações</span>
              <ChevronRight className={`size-4 transition-transform duration-200 ${page === "settings" || page === "appearance" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
            {session.role === "admin" ? (
              <button
                type="button"
                aria-current={page === "admin" ? "page" : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${page === "admin" ? "bg-brand-soft text-primary shadow-sm" : "text-slate-600 hover:translate-x-1 hover:bg-slate-50 hover:text-slate-950"}`}
                onClick={() => abrirPagina("admin")}
              >
                <ShieldCheck className="size-[18px]" aria-hidden="true" />
                <span className="flex-1">Administração</span>
                <ChevronRight className={`size-4 transition-transform duration-200 ${page === "admin" ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} aria-hidden="true" />
              </button>
            ) : null}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-5">
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-rose-600 transition-all duration-200 hover:translate-x-1 hover:bg-rose-50"
              onClick={sairDaConta}
            >
              <LogOut className="size-[18px] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              Sair da conta
            </button>
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
                          <div className="relative flex min-h-[202px] flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <div className="text-[15px] font-black italic tracking-tight drop-shadow-sm">
                              RioCard <span className="font-semibold">Mais</span>
                            </div>
                            <Wifi
                              aria-hidden="true"
                              className="size-6 rotate-90 text-white/90 drop-shadow-sm"
                            />
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div
                              aria-hidden="true"
                              className="relative h-9 w-11 shrink-0 overflow-hidden rounded-[8px] border border-amber-100/70 bg-gradient-to-br from-[#fff0b3] via-[#d9b45b] to-[#a77b25] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-2px_3px_rgba(90,55,0,0.25)]"
                            >
                              <span className="absolute bottom-0 left-1/3 top-0 w-px bg-amber-900/30" />
                              <span className="absolute bottom-0 right-1/3 top-0 w-px bg-amber-900/30" />
                              <span className="absolute left-0 right-0 top-1/2 h-px bg-amber-900/30" />
                              <span className="absolute inset-x-0 top-[27%] h-[46%] rounded-full border-y border-amber-900/25" />
                            </div>
                            <div className="min-w-0 flex-1 text-right">
                              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/65">
                                Cartão de transporte
                              </p>
                              <p className="truncate text-lg font-extrabold tracking-tight drop-shadow-sm sm:text-xl">
                                {getNomeCartaoExibicao(cartao.nome)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
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
                                className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-3 text-sm font-bold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                <Pencil className="size-5" aria-hidden="true" />
                                Editar cartão
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (
                                    window.confirm(
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
                    className="flex min-h-[244px] w-full shrink-0 snap-center flex-col items-center justify-center gap-4 rounded-[24px] border-2 border-dashed border-[#b8cbe0] bg-[#f3f6fb] px-6 text-center text-[#35516e] transition-[transform,border-color,background-color,box-shadow] duration-300 hover:scale-[1.01] hover:border-[#0079fa] hover:bg-white hover:shadow-[0_14px_30px_rgba(0,121,250,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0079fa] focus-visible:ring-offset-2"
                  >
                    <span className="flex size-16 items-center justify-center rounded-2xl border border-[#d5e3f1] bg-white text-[#0079fa] shadow-sm transition-transform duration-300 hover:rotate-90">
                      <Plus className="size-8" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-lg font-extrabold text-[#0b1f33]">
                        Adicionar cartão
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        Deslize após o último cartão para adicionar outro
                      </span>
                    </span>
                  </button>
                </div>
              </div>
              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Custo por dia
                </p>
                <p className="mt-2 text-2xl font-extrabold text-[#0b1f33]">
                  {brl(calc.custoDia)}
                </p>
              </div>

              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Resumo
                </p>
                <div className="mt-3 space-y-3 text-sm text-[#0b1f33]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Total usado</span>
                    <strong>{brl(calc.totalGasto)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Sobra</span>
                    <strong>{brl(calc.sobra)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground">Recarga vence</span>
                    <strong className="text-foreground">
                      {calc.recarga
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

        {page === "calendar" ? (
          <section className="mx-auto max-w-4xl pb-8">
            <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Visão mensal
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold capitalize tracking-tight text-slate-950">
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
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => mudarMes(1)}
                    aria-label="Próximo mês"
                    className="size-9 rounded-xl"
                  >
                    <ChevronRight className="size-4" />
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

        {page === "settings" ? (
          <section className="mx-auto max-w-2xl space-y-4">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-5 shadow-sm sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Configurações
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#0b1f33]">
                Personalize seu app
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha como as cores do RioCard Planner aparecem para você.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPage("appearance")}
              className="group flex w-full items-center gap-4 rounded-[22px] border border-[#dfe9f5] bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-5"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-primary transition-transform duration-200 group-hover:scale-105">
                <Palette className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-[#0b1f33]">
                  Aparência do app
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  10 temas de cores · atual: {APP_THEMES[temaAparencia].name}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                aria-hidden="true"
              />
            </button>
          </section>
        ) : null}

        {page === "appearance" ? (
          <section className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-[24px] border border-[#dfe9f5] bg-white p-5 shadow-sm sm:p-7">
              <button
                type="button"
                onClick={() => setPage("settings")}
                className="mb-5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-primary transition hover:bg-brand-soft"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Configurações
              </button>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Personalização
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#0b1f33]">
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
              <div className="rounded-2xl border border-[#dfe9f5] bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
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
                          <span className="block text-sm font-bold text-[#0b1f33]">
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

        {page === "admin" && session.role === "admin" ? (
          <section className="space-y-6 pb-8">
            <header className="flex flex-wrap items-end justify-between gap-4 rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#12345a] p-6 text-white shadow-lg sm:p-8">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Painel administrativo
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Visão geral
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  Acompanhe as contas cadastradas e gerencie os acessos do RioCard Planner.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void carregarUsuariosAdmin()}
                disabled={adminLoading}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw
                  className={`mr-2 size-4 ${adminLoading ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Atualizar dados
              </Button>
            </header>

            {adminError ? (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <span>{adminError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void carregarUsuariosAdmin()}
                  disabled={adminLoading}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Contas cadastradas
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  {adminLoading && adminUsers.length === 0 ? "—" : adminResumo.total}
                </p>
                <p className="mt-1 text-xs text-slate-500">Total na plataforma</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Clientes
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <UserRound className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  {adminLoading && adminUsers.length === 0 ? "—" : adminResumo.clientes}
                </p>
                <p className="mt-1 text-xs text-slate-500">Contas padrão</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Administradores
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  {adminLoading && adminUsers.length === 0 ? "—" : adminResumo.administradores}
                </p>
                <p className="mt-1 text-xs text-slate-500">Com acesso administrativo</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Novos nos últimos 30 dias
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Plus className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                  {adminLoading && adminUsers.length === 0 ? "—" : adminResumo.novos30Dias}
                </p>
                <p className="mt-1 text-xs text-slate-500">Baseado na data de cadastro</p>
              </article>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-950">Novos cadastros</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Registros por dia nos últimos sete dias
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {adminResumo.ultimosSeteDias.reduce(
                      (total, dia) => total + dia.total,
                      0,
                    )} cadastrados
                  </span>
                </div>
                <div
                  className="mt-6 grid h-40 grid-cols-7 items-end gap-2 sm:gap-4"
                  role="img"
                  aria-label="Gráfico de novos cadastros por dia nos últimos sete dias"
                >
                  {adminResumo.ultimosSeteDias.map(({ data, total }) => (
                    <div
                      key={data.toISOString()}
                      className="flex h-full flex-col items-center justify-end gap-2"
                    >
                      <span className="text-xs font-bold text-slate-600">
                        {total || ""}
                      </span>
                      <div className="flex h-28 w-full items-end rounded-t-lg bg-slate-50">
                        <div
                          className="w-full min-h-1 rounded-t-lg bg-gradient-to-t from-primary to-primary/60 transition-all duration-500"
                          style={{
                            height: `${Math.max(4, (total / adminResumo.maximoGrafico) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                        {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-primary">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-950">Acessos e segurança</h2>
                    <p className="text-xs text-slate-500">Resumo dos papéis</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">Clientes</span>
                      <span className="font-bold text-slate-900">{adminResumo.clientes}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${adminResumo.total ? (adminResumo.clientes / adminResumo.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">Administradores</span>
                      <span className="font-bold text-slate-900">{adminResumo.administradores}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{
                          width: `${adminResumo.total ? (adminResumo.administradores / adminResumo.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    Alterações de papel e exclusões são verificadas pelo servidor. Sua própria conta administrativa não pode ser removida ou rebaixada por este painel.
                  </p>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-950">Gestão de usuários</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {usuariosAdminFiltrados.length} de {adminUsers.length} contas
                    </p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <label className="relative min-w-0 flex-1 sm:w-72">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                      <input
                        type="search"
                        value={adminBusca}
                        onChange={(event) => setAdminBusca(event.target.value)}
                        placeholder="Buscar nome, email ou celular"
                        aria-label="Buscar usuários"
                        className="field h-10 pl-9"
                      />
                    </label>
                    <select
                      value={adminFiltro}
                      onChange={(event) =>
                        setAdminFiltro(event.target.value as typeof adminFiltro)
                      }
                      aria-label="Filtrar por tipo de conta"
                      className="field h-10 sm:w-44"
                    >
                      <option value="all">Todos os papéis</option>
                      <option value="client">Clientes</option>
                      <option value="admin">Administradores</option>
                    </select>
                  </div>
                </div>
              </div>

              {adminLoading && adminUsers.length === 0 ? (
                <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
                  <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
                  Carregando contas…
                </div>
              ) : usuariosAdminFiltrados.length === 0 ? (
                <div className="p-10 text-center">
                  <Users className="mx-auto size-9 text-slate-300" aria-hidden="true" />
                  <p className="mt-3 font-semibold text-slate-800">
                    {adminUsers.length === 0 ? "Nenhuma conta cadastrada" : "Nenhum resultado encontrado"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {adminUsers.length === 0
                      ? "As contas criadas aparecerão aqui."
                      : "Tente alterar o termo da busca ou o filtro selecionado."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-bold">Usuário</th>
                        <th scope="col" className="px-5 py-3 font-bold">Celular</th>
                        <th scope="col" className="px-5 py-3 font-bold">Cadastro</th>
                        <th scope="col" className="px-5 py-3 font-bold">Papel</th>
                        <th scope="col" className="px-5 py-3 text-right font-bold">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usuariosAdminFiltrados.map((usuario) => {
                        const eMinhaConta = usuario.id === session.id;
                        const dataCadastro = new Date(usuario.created_at);
                        return (
                          <tr key={usuario.id} className="transition-colors hover:bg-slate-50/80">
                            <td className="px-5 py-4">
                              <div className="flex min-w-56 items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-extrabold text-primary">
                                  {(usuario.name.trim().charAt(0) || "U").toUpperCase()}
                                </span>
                                <span className="min-w-0">
                                  <span className="flex items-center gap-2 font-bold text-slate-900">
                                    <span className="truncate">{usuario.name}</span>
                                    {eMinhaConta ? (
                                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Você</span>
                                    ) : null}
                                  </span>
                                  <span className="block truncate text-xs text-slate-500">{usuario.email}</span>
                                </span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">{usuario.celular}</td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {Number.isNaN(dataCadastro.getTime())
                                ? "—"
                                : dataCadastro.toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                            </td>
                            <td className="px-5 py-4">
                              <select
                                aria-label={`Papel de ${usuario.name}`}
                                value={usuario.role}
                                onChange={(event) =>
                                  void atualizarRoleUsuario(
                                    usuario,
                                    event.target.value as AdminUser["role"],
                                  )
                                }
                                disabled={eMinhaConta || adminAcaoId !== null}
                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${usuario.role === "admin" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                              >
                                <option value="client">Cliente</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => void excluirUsuarioAdmin(usuario)}
                                disabled={eMinhaConta || adminAcaoId !== null}
                              >
                                {adminAcaoId === usuario.id ? (
                                  <RefreshCw className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="mr-2 size-3.5" aria-hidden="true" />
                                )}
                                Excluir
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </section>
        ) : null}
      </div>

      {novoCartaoAberto ? (
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
                  autoFocus
                  required
                  maxLength={40}
                  type="text"
                  value={novoCartaoNome}
                  onChange={(event) => setNovoCartaoNome(event.target.value)}
                  placeholder="Ex.: Cartão principal"
                  className="field"
                />
              </Campo>

              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-foreground">
                  Selecionar cor
                </legend>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {(Object.keys(CARD_THEMES) as CardColorKey[]).map((cor) => {
                    const tema = CARD_THEMES[cor];
                    const selecionada = novoCartaoCor === cor;
                    return (
                      <button
                        key={cor}
                        type="button"
                        aria-label={`Selecionar cor ${tema.name}`}
                        aria-pressed={selecionada}
                        onClick={() => setNovoCartaoCor(cor)}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-semibold transition-all duration-200 ${selecionada ? "border-[#0079fa] bg-blue-50 text-[#0754b8] ring-2 ring-[#0079fa]/20" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <span
                          className="size-5 shrink-0 rounded-full border border-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${tema.from} 0%, ${tema.via} 52%, ${tema.to} 100%)`,
                          }}
                        />
                        {tema.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

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
