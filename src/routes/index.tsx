import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Eye, EyeOff, Menu, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import rioCardLogo from "@/assets/riocard-marca.svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planejador de passagens — RioCard Mais" },
      { name: "description", content: "Calcule quantos dias de curso seu saldo cobre e descubra a data da próxima recarga." },
      { property: "og:title", content: "Planejador de passagens — RioCard Mais" },
      { property: "og:description", content: "Organize seu saldo, seus dias de curso e a próxima recarga em um calendário simples." },
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

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];
const STORAGE_KEY = "riocard-planner";
const STORAGE_ACCOUNTS_KEY = "riocard-accounts";
const STORAGE_SESSION_KEY = "riocard-session";
const API_BASE = "/api";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const SESSION_TTL_REMEMBER_MS = 1000 * 60 * 60 * 24 * 30;

const CARD_THEMES = {
  azul: { name: "Azul", from: "#0f8cff", via: "#0080ff", to: "#0069e8", glow: "rgba(0, 121, 250, 0.35)" },
  rosa: { name: "Rosa", from: "#ff5db1", via: "#ff2a8e", to: "#d8006d", glow: "rgba(255, 0, 140, 0.35)" },
  verde: { name: "Verde", from: "#27c77d", via: "#1ead6c", to: "#0f8f53", glow: "rgba(22, 163, 74, 0.35)" },
  roxo: { name: "Roxo", from: "#8b5cf6", via: "#7c3aed", to: "#5b2ecf", glow: "rgba(124, 58, 237, 0.35)" },
  laranja: { name: "Laranja", from: "#ff9f43", via: "#ff8a3d", to: "#e66a00", glow: "rgba(234, 88, 12, 0.35)" },
  cinza: { name: "Cinza", from: "#667085", via: "#475467", to: "#344054", glow: "rgba(71, 84, 103, 0.35)" },
} as const;

type CardColorKey = keyof typeof CARD_THEMES;

type Account = {
  firstName: string;
  celular: string;
  password?: string;
  token?: string;
  expiresAt?: number;
  rememberMe?: boolean;
};

type Cartao = {
  id: string;
  nome: string;
  saldo: string;
  tarifa: string;
  viagens: string;
  inicio: string;
  feriados: string[];
  alertaRecargaAtivo: boolean;
  saldoPrivado: boolean;
  cor: CardColorKey;
};

const getCardTheme = (cor?: string) => {
  const key = cor && cor in CARD_THEMES ? (cor as CardColorKey) : "azul";
  return CARD_THEMES[key];
};

const getNomeCartaoExibicao = (nome?: string) => (nome ?? "").trim() || "Cartão";

const normalizePhone = (valor: string) => valor.replace(/\D/g, "");
const gerarTokenSessao = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getSessionTtl = (rememberMe: boolean) => (rememberMe ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_MS);
const expiraSessaoEm = (rememberMe = true) => Date.now() + getSessionTtl(rememberMe);
const isSessionValid = (session: Partial<Account> | null) => {
  if (!session?.celular || !session?.firstName || !session?.token || !session?.expiresAt) return false;
  return Number(session.expiresAt) > Date.now();
};

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
const getUserStorageKey = (celular: string) => `${STORAGE_KEY}-${normalizePhone(celular) || "usuario"}`;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseData = (valor: string | null) => {
  if (!valor) return null;
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
};

async function apiRequest<T>(path: string, init?: RequestInit, authToken?: string): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
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
      <span className={`${small ? "text-lg" : "text-[2rem]"} font-light tracking-[-0.06em] leading-none`}>
        <span className="text-[#0085fa]">RioCard</span> <span className="text-[#ff008c]">Mais</span>
      </span>
    </div>
  );
}

function Index() {
  const hoje = new Date();
  const [saldo, setSaldo] = useState("100");
  const [tarifa, setTarifa] = useState("4.70");
  const [viagens, setViagens] = useState("2");
  const [inicio, setInicio] = useState(iso(hoje));
  const [feriados, setFeriados] = useState<string[]>([]);
  const [page, setPage] = useState<"home" | "calendar" | "settings">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mesRef, setMesRef] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [cartaoAtivoId, setCartaoAtivoId] = useState<string | null>(null);
  const [alertaRecargaAtivo, setAlertaRecargaAtivo] = useState(true);
  const [notificacaoPermissao, setNotificacaoPermissao] = useState<NotificationPermission | "unsupported">("unsupported");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [session, setSession] = useState<Account | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginCelular, setLoginCelular] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [cadastroNome, setCadastroNome] = useState("");
  const [cadastroCelular, setCadastroCelular] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [cadastroConfirmacao, setCadastroConfirmacao] = useState("");
  const [authError, setAuthError] = useState("");
  const [celularEmUso, setCelularEmUso] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const ultimaNotificacaoRef = useRef<string | null>(null);

  const limparSessao = (motivo = "Sessão expirada.") => {
    setSession(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    setPage("home");
    setMenuOpen(false);
    setAuthError(motivo);
  };

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
    try {
      const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!rawSession) return;
      const savedSession = JSON.parse(rawSession) as Account;

      if (!isSessionValid(savedSession)) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        setSession(null);
        return;
      }

      setRememberMe(savedSession.rememberMe ?? true);
      setSession(savedSession);
    } catch {
      localStorage.removeItem(STORAGE_SESSION_KEY);
      setSession(null);
    }
  }, []);

  useEffect(() => {
    if (!session?.token || !session?.expiresAt) return;

    const tempoRestante = Number(session.expiresAt) - Date.now();
    if (tempoRestante <= 0) {
      limparSessao("Sua sessão expirou. Faça login novamente.");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      limparSessao("Sua sessão expirou. Faça login novamente.");
    }, tempoRestante);

    return () => window.clearTimeout(timeoutId);
  }, [session]);

  const aplicarCartaoAtivo = (cartao: Cartao | null) => {
    if (!cartao) return;
    setSaldo(cartao.saldo);
    setTarifa(cartao.tarifa);
    setViagens(cartao.viagens);
    setInicio(cartao.inicio);
    setFeriados(cartao.feriados);
    setAlertaRecargaAtivo(cartao.alertaRecargaAtivo);
  };

  const atualizarCartaoAtual = (updates: Partial<Cartao>) => {
    if (!cartaoAtivoId) return;
    setCartoes((lista) => lista.map((cartao) => (cartao.id === cartaoAtivoId ? { ...cartao, ...updates } : cartao)));
  };

  const atualizarCartaoPorId = (id: string, updates: Partial<Cartao>) => {
    setCartoes((lista) => lista.map((cartao) => (cartao.id === id ? { ...cartao, ...updates } : cartao)));
  };

  const criarCartaoPadrao = (nome = "Cartão principal", overrides: Partial<Cartao> = {}): Cartao => ({
    id: `cartao-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    nome,
    saldo: "100",
    tarifa: "4.70",
    viagens: "2",
    inicio: iso(hoje),
    feriados: [],
    alertaRecargaAtivo: true,
    saldoPrivado: true,
    cor: "azul",
    ...overrides,
  });

  const carregarDadosDoUsuario = async (usuario: Account) => {
    try {
      const response = await apiRequest<{ data?: Record<string, unknown> }>(
        '/user-data?celular=' + encodeURIComponent(usuario.celular),
        undefined,
        usuario.token,
      );
      const salvo = (response.data ?? {}) as Record<string, unknown>;
      const cardsRaw = Array.isArray(salvo.cards) ? (salvo.cards as Array<Record<string, unknown>>) : [];

      if (cardsRaw.length > 0) {
        const normalizedCards = cardsRaw.map((card, index) => ({
          id: String(card.id ?? `cartao-${index + 1}`),
          nome: String(card.nome ?? `Cartão ${index + 1}`),
          saldo: String(card.saldo ?? "100"),
          tarifa: String(card.tarifa ?? "4.70"),
          viagens: String(card.viagens ?? "2"),
          inicio: String(card.inicio ?? iso(hoje)),
          feriados: Array.isArray(card.feriados) ? (card.feriados as string[]) : [],
          alertaRecargaAtivo: typeof card.alertaRecargaAtivo === "boolean" ? card.alertaRecargaAtivo : true,
          saldoPrivado: typeof card.saldoPrivado === "boolean" ? card.saldoPrivado : true,
          cor: typeof card.cor === "string" && card.cor in CARD_THEMES ? (card.cor as CardColorKey) : "azul",
        }));

        setCartoes(normalizedCards);
        const activeId = typeof salvo.activeCardId === "string" && normalizedCards.some((item) => item.id === salvo.activeCardId)
          ? salvo.activeCardId
          : normalizedCards[0]?.id ?? null;
        setCartaoAtivoId(activeId);
        const ativo = normalizedCards.find((item) => item.id === activeId) ?? normalizedCards[0];
        if (ativo) aplicarCartaoAtivo(ativo);
        return;
      }

      const legacyCard = criarCartaoPadrao("Cartão principal", {
        saldo: String(salvo.saldo ?? "100"),
        tarifa: String(salvo.tarifa ?? "4.70"),
        viagens: String(salvo.viagens ?? "2"),
        inicio: String(salvo.inicio ?? iso(hoje)),
        feriados: Array.isArray(salvo.feriados) ? (salvo.feriados as string[]) : [],
        alertaRecargaAtivo: typeof salvo.alertaRecargaAtivo === "boolean" ? salvo.alertaRecargaAtivo : true,
        saldoPrivado: typeof salvo.saldoPrivado === "boolean" ? salvo.saldoPrivado : true,
      });
      setCartoes([legacyCard]);
      setCartaoAtivoId(legacyCard.id);
      aplicarCartaoAtivo(legacyCard);
    } catch {
      try {
        const userKey = getUserStorageKey(usuario.celular);
        const raw = localStorage.getItem(userKey);
        if (!raw) return;
        const salvo = JSON.parse(raw) as Record<string, unknown>;
        const cardsRaw = Array.isArray(salvo.cards) ? (salvo.cards as Array<Record<string, unknown>>) : [];

        if (cardsRaw.length > 0) {
          const normalizedCards = cardsRaw.map((card, index) => ({
            id: String(card.id ?? `cartao-${index + 1}`),
            nome: String(card.nome ?? `Cartão ${index + 1}`),
            saldo: String(card.saldo ?? "100"),
            tarifa: String(card.tarifa ?? "4.70"),
            viagens: String(card.viagens ?? "2"),
            inicio: String(card.inicio ?? iso(hoje)),
            feriados: Array.isArray(card.feriados) ? (card.feriados as string[]) : [],
            alertaRecargaAtivo: typeof card.alertaRecargaAtivo === "boolean" ? card.alertaRecargaAtivo : true,
            saldoPrivado: typeof card.saldoPrivado === "boolean" ? card.saldoPrivado : true,
            cor: typeof card.cor === "string" && card.cor in CARD_THEMES ? (card.cor as CardColorKey) : "azul",
          }));
          setCartoes(normalizedCards);
          const activeId = typeof salvo.activeCardId === "string" ? salvo.activeCardId : normalizedCards[0]?.id ?? null;
          setCartaoAtivoId(activeId);
          const ativo = normalizedCards.find((item) => item.id === activeId) ?? normalizedCards[0];
          if (ativo) aplicarCartaoAtivo(ativo);
          return;
        }

        const fallbackCard = criarCartaoPadrao("Cartão principal", {
          saldo: String(salvo.saldo ?? "100"),
          tarifa: String(salvo.tarifa ?? "4.70"),
          viagens: String(salvo.viagens ?? "2"),
          inicio: String(salvo.inicio ?? iso(hoje)),
          feriados: Array.isArray(salvo.feriados) ? (salvo.feriados as string[]) : [],
          alertaRecargaAtivo: typeof salvo.alertaRecargaAtivo === "boolean" ? salvo.alertaRecargaAtivo : true,
          saldoPrivado: typeof salvo.saldoPrivado === "boolean" ? salvo.saldoPrivado : true,
        });
        setCartoes([fallbackCard]);
        setCartaoAtivoId(fallbackCard.id);
        aplicarCartaoAtivo(fallbackCard);
      } catch { /* mantém os valores iniciais */ }
    }
  };

  useEffect(() => {
    if (!session) return;
    void carregarDadosDoUsuario(session);
  }, [session]);

  useEffect(() => {
    const celular = normalizePhone(cadastroCelular);
    if (celular.length !== 11) {
      setCelularEmUso(false);
      return;
    }

    let ativo = true;

    apiRequest<{ exists?: boolean }>('/auth/check-phone?celular=' + encodeURIComponent(celular))
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
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotificacaoPermissao("unsupported");
      return;
    }
    setNotificacaoPermissao(Notification.permission);
  }, []);

  const persistirConfiguracoes = useCallback(async (opcoes: { mostrarToast?: boolean; cartoesOverride?: Cartao[] } = {}) => {
    if (!session) {
      if (opcoes.mostrarToast) {
        toast.error("Faça login para salvar seus dados.");
      }
      return;
    }

    const baseCartoes = opcoes.cartoesOverride ?? cartoes;
    const listaCartoes = baseCartoes.map((cartao) => {
      if (cartao.id !== cartaoAtivoId) return cartao;
      return {
        ...cartao,
        saldo,
        tarifa,
        viagens,
        inicio,
        feriados,
        alertaRecargaAtivo,
        saldoPrivado: cartao.saldoPrivado ?? true,
      };
    });

    const payload = { cards: listaCartoes, activeCardId: cartaoAtivoId };

    try {
      const userKey = getUserStorageKey(session.celular);
      await apiRequest(
        '/user-data',
        {
          method: 'POST',
          body: JSON.stringify({ celular: session.celular, data: payload }),
        },
        session.token,
      );

      localStorage.setItem(userKey, JSON.stringify(payload));
      if (opcoes.mostrarToast) {
        toast.success("Configurações salvas");
      }
    } catch (error) {
      if (opcoes.mostrarToast) {
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
      }
    }
  }, [session, cartoes, cartaoAtivoId, saldo, tarifa, viagens, inicio, feriados, alertaRecargaAtivo]);

  useEffect(() => {
    if (!session || page !== "settings") return;

    const timeoutId = window.setTimeout(() => {
      void persistirConfiguracoes({ mostrarToast: false });
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [page, session, cartoes, cartaoAtivoId, saldo, tarifa, viagens, inicio, feriados, alertaRecargaAtivo, persistirConfiguracoes]);

  const salvarConfiguracoes = async () => {
    await persistirConfiguracoes({ mostrarToast: true });
    setPage("home");
  };

  const alternarSaldoPrivado = (id: string) => {
    const proximoEstado = cartoes.map((cartao) => {
      if (cartao.id !== id) return cartao;
      return { ...cartao, saldoPrivado: !(cartao.saldoPrivado ?? true) };
    });

    setCartoes(proximoEstado);

    if (session) {
      void persistirConfiguracoes({ cartoesOverride: proximoEstado, mostrarToast: false });
    }
  };

  const abrirPagina = (novaPagina: "home" | "calendar" | "settings") => {
    setPage(novaPagina);
    setMenuOpen(false);
  };

  const selecionarCartao = (id: string) => {
    const cartao = cartoes.find((item) => item.id === id);
    if (!cartao) return;
    setCartaoAtivoId(id);
    aplicarCartaoAtivo(cartao);
  };

  const handleCardScroll = () => {
    const container = carouselRef.current;
    if (!container || cartoes.length === 0) return;

    const index = Math.round(container.scrollLeft / Math.max(container.clientWidth, 1));
    const cartao = cartoes[index];
    if (cartao && cartao.id !== cartaoAtivoId) {
      selecionarCartao(cartao.id);
    }
  };

  const adicionarCartao = () => {
    const proximoNumero = cartoes.length + 1;
    const novoCartao = criarCartaoPadrao(`Cartão ${proximoNumero}`);
    setCartoes((lista) => [...lista, novoCartao]);
    setCartaoAtivoId(novoCartao.id);
    aplicarCartaoAtivo(novoCartao);
  };

  const renomearCartao = (id: string, nome: string) => {
    setCartoes((lista) => lista.map((cartao) => (cartao.id === id ? { ...cartao, nome } : cartao)));
  };

  const removerCartao = (id: string) => {
    const restante = cartoes.filter((cartao) => cartao.id !== id);

    if (restante.length === 0) {
      setCartoes([]);
      setCartaoAtivoId(null);
      return;
    }

    const proximoAtivo = cartaoAtivoId === id ? restante[0] : restante.find((cartao) => cartao.id === cartaoAtivoId) ?? restante[0];
    setCartoes(restante);
    setCartaoAtivoId(proximoAtivo.id);
    aplicarCartaoAtivo(proximoAtivo);
  };

  const salvarConta = (conta: Account) => {
    const contas = JSON.parse(localStorage.getItem(STORAGE_ACCOUNTS_KEY) ?? "[]") as Account[];
    const jaExiste = contas.some((item) => normalizePhone(item.celular) === normalizePhone(conta.celular));
    const contaPersistida: Account = {
      ...conta,
      password: undefined,
      token: conta.token ?? gerarTokenSessao(),
      expiresAt: conta.expiresAt ?? expiraSessaoEm(conta.rememberMe ?? rememberMe),
      rememberMe: conta.rememberMe ?? rememberMe,
    };
    const lista = jaExiste ? contas.map((item) => (normalizePhone(item.celular) === normalizePhone(conta.celular) ? contaPersistida : item)) : [...contas, contaPersistida];
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(lista));
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(contaPersistida));
    setSession(contaPersistida);
    setPage("home");
    setMenuOpen(false);
  };

  const entrarNaConta = async () => {
    const celular = normalizePhone(loginCelular);
    const erroCelular = validarCelular(loginCelular);

    if (!celular || !loginSenha.trim()) {
      setAuthError("Informe o celular e a senha.");
      return;
    }

    if (erroCelular) {
      setAuthError(erroCelular);
      return;
    }

    try {
      const conta = await apiRequest<Account>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ celular, password: loginSenha, rememberMe }),
      });

      const sessionData: Account = {
        firstName: conta.firstName,
        celular: conta.celular,
        token: conta.token ?? gerarTokenSessao(),
        expiresAt: conta.expiresAt ?? expiraSessaoEm(rememberMe),
        rememberMe: conta.rememberMe ?? rememberMe,
      };

      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);
      setAuthError("");
      setPage("home");
      setLoginCelular("");
      setLoginSenha("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Celular ou senha inválidos.");
    }
  };

  const criarConta = async () => {
    const nome = cadastroNome.trim();
    const celular = normalizePhone(cadastroCelular);
    const senha = cadastroSenha.trim();
    const confirmacao = cadastroConfirmacao.trim();
    const erroCelular = validarCelular(cadastroCelular);

    if (!nome || !celular || !senha || !confirmacao) {
      setAuthError("Preencha todos os campos para cadastrar.");
      return;
    }

    if (erroCelular) {
      setAuthError(erroCelular);
      return;
    }

    if (celularEmUso) {
      setAuthError("Este celular já está cadastrado.");
      return;
    }

    if (senha !== confirmacao) {
      setAuthError("A confirmação da senha precisa bater com a senha.");
      return;
    }

    try {
      const novaConta = await apiRequest<Account>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ firstName: nome, celular, password: senha, rememberMe }),
      });

      const sessionData: Account = {
        firstName: novaConta.firstName,
        celular: novaConta.celular,
        token: novaConta.token ?? gerarTokenSessao(),
        expiresAt: novaConta.expiresAt ?? expiraSessaoEm(rememberMe),
        rememberMe: novaConta.rememberMe ?? rememberMe,
      };

      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);
      setAuthError("");
      setCadastroNome("");
      setCadastroCelular("");
      setCadastroSenha("");
      setCadastroConfirmacao("");
      setPage("home");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  };

  const sairDaConta = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    setPage("home");
    setMenuOpen(false);
    setAuthError("");
  };

  const calc = useMemo(() => {
    const valor = Number(saldo.replace(",", ".")) || 0;
    const preco = Number(tarifa.replace(",", ".")) || 0;
    const custoDia = preco * (Number(viagens) || 0);
    const partesInicio = inicio.split("-").map(Number);
    const dataInicio = new Date(partesInicio[0] || 1970, (partesInicio[1] || 1) - 1, partesInicio[2] || 1);
    const diasCobertos = custoDia > 0 ? Math.floor(valor / custoDia) : 0;
    const sobra = custoDia > 0 ? valor - diasCobertos * custoDia : valor;
    const cobertos: string[] = [];
    const cursor = new Date(dataInicio);
    let guard = 0;
    while (cobertos.length < diasCobertos && guard < 2000) {
      if (cursor.getDay() >= 1 && cursor.getDay() <= 5 && !feriados.includes(iso(cursor))) cobertos.push(iso(cursor));
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    let recarga: string | null = null;
    guard = 0;
    while (!recarga && guard < 2000) {
      if (cursor.getDay() >= 1 && cursor.getDay() <= 5 && !feriados.includes(iso(cursor))) recarga = iso(cursor);
      cursor.setDate(cursor.getDate() + 1);
      guard++;
    }
    return { custoDia, diasCobertos, sobra, cobertos: new Set(cobertos), ultimoDia: cobertos.at(-1) ?? null, recarga, totalGasto: diasCobertos * custoDia };
  }, [saldo, tarifa, viagens, inicio, feriados]);

  const grade = useMemo(() => {
    const ano = mesRef.getFullYear();
    const mes = mesRef.getMonth();
    const cells: (Date | null)[] = Array.from({ length: new Date(ano, mes, 1).getDay() }, () => null);
    for (let dia = 1; dia <= new Date(ano, mes + 1, 0).getDate(); dia++) cells.push(new Date(ano, mes, dia));
    return cells;
  }, [mesRef]);

  const formatarData = (valor: string | null) => {
    if (!valor) return "—";
    const [ano, mes, dia] = valor.split("-").map(Number);
    return new Date(ano || 1970, (mes || 1) - 1, dia || 1).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  };

  const alertaRecarga = useMemo(() => {
    const dataRecarga = parseData(calc.recarga);
    const dataUltimoDia = parseData(calc.ultimoDia);
    if (!dataRecarga) return null;

    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataRecargaSemHora = new Date(dataRecarga.getFullYear(), dataRecarga.getMonth(), dataRecarga.getDate());
    const diffDias = Math.round((dataRecargaSemHora.getTime() - hojeSemHora.getTime()) / 86400000);

    if (hojeSemHora.getTime() === dataRecargaSemHora.getTime()) {
      return {
        chave: `${calc.recarga}-hoje`,
        titulo: "Hoje é dia de recarga",
        mensagem: `Seu saldo vai acabar hoje. Recarregue antes de ${formatarData(calc.recarga)} para continuar usando o cartão.`,
      };
    }

    if (diffDias === 1) {
      return {
        chave: `${calc.recarga}-amanha`,
        titulo: "Saldo vai acabar em 1 dia",
        mensagem: `Você ainda tem saldo até ${formatarData(calc.ultimoDia)}. Recarregue até ${formatarData(calc.recarga)} antes de perder o benefício.`,
      };
    }

    if (dataUltimoDia && hojeSemHora.getTime() >= dataUltimoDia.getTime() && hojeSemHora.getTime() <= dataRecargaSemHora.getTime()) {
      return {
        chave: `${calc.recarga}-ultimo-dia`,
        titulo: "Seu saldo está acabando",
        mensagem: `O último dia com saldo é ${formatarData(calc.ultimoDia)} e a recarga deve ser feita até ${formatarData(calc.recarga)}.`,
      };
    }

    return null;
  }, [calc.recarga, calc.ultimoDia, hoje]);

  useEffect(() => {
    if (!alertaRecargaAtivo) {
      ultimaNotificacaoRef.current = null;
      return;
    }

    if (!alertaRecarga || !alertaRecarga.chave) return;
    if (ultimaNotificacaoRef.current === alertaRecarga.chave) return;
    ultimaNotificacaoRef.current = alertaRecarga.chave;

    toast.warning(alertaRecarga.titulo, {
      description: alertaRecarga.mensagem,
      duration: 8000,
    });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(alertaRecarga.titulo, {
        body: alertaRecarga.mensagem,
        icon: "/favicon.png",
      });
    }
  }, [alertaRecarga, alertaRecargaAtivo]);

  const pedirPermissaoNotificacao = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Seu navegador não suporta notificações do site.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificacaoPermissao(permission);

    if (permission === "granted") {
      toast.success("Notificações ativadas com sucesso!");
      if (alertaRecarga) {
        new Notification(alertaRecarga.titulo, {
          body: alertaRecarga.mensagem,
          icon: "/favicon.png",
        });
      }
    }
  };

  const instalarNoCelular = async () => {
    if (!installPrompt) {
      toast.error("Instalação não disponível no momento. Tente em outro navegador ou use o botão de menu do celular.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      toast.success("App instalado com sucesso!");
    }

    setInstallPrompt(null);
  };

  const testarAlerta = () => {
    const mensagemTeste = calc.recarga
      ? `Teste: ${formatarData(calc.recarga)} é o dia de recarga do seu saldo.`
      : "Teste: seu saldo está chegando ao fim e precisa de recarga.";

    toast.warning("Teste de alerta de recarga", {
      description: mensagemTeste,
      duration: 8000,
    });

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Teste de alerta de recarga", {
        body: mensagemTeste,
        icon: "/favicon.png",
      });
    }
  };

  const diasAulaNoMes = grade.filter((d) => d && calc.cobertos.has(iso(d))).length;
  const mudarMes = (delta: number) => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const toggleFeriado = (d: Date) => setFeriados((lista) => lista.includes(iso(d)) ? lista.filter((item) => item !== iso(d)) : [...lista, iso(d)]);

  const inicialUsuario = (session?.firstName?.trim().charAt(0) || "U").toUpperCase();

  useEffect(() => {
    if (!cartaoAtivoId || !carouselRef.current) return;
    const card = cardRefs.current[cartaoAtivoId];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [cartaoAtivoId, cartoes]);

  if (!session) {
    return (
      <main className="min-h-screen bg-[#f3f6fb] px-0 py-0">
        <div className="mx-auto min-h-screen max-w-md overflow-hidden bg-[#f3f6fb] shadow-none">
          <div className="px-4 pb-4 pt-6">
            <div className="flex justify-center py-3">
              <RioBrand />
            </div>
          </div>

          <div className="bg-[#f3f6fb] px-4 pb-8 pt-2">
            <div className="rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-[#dfe9f5]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0079fa]">Acesso</p>
              <h1 className="mt-2 text-2xl font-black text-[#0b1f33]">Entre na sua conta - ok</h1>
              <p className="mt-2 text-sm text-muted-foreground">Todos os dados do app ficam vinculados à conta logada.</p>

              <div className="mt-5 flex rounded-xl bg-[#eef5ff] p-1">
                <button type="button" onClick={() => setAuthMode("login")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${authMode === "login" ? "bg-white text-[#0079fa] shadow-sm" : "text-muted-foreground"}`}>
                  Entrar
                </button>
                <button type="button" onClick={() => setAuthMode("register")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${authMode === "register" ? "bg-white text-[#0079fa] shadow-sm" : "text-muted-foreground"}`}>
                  Cadastrar
                </button>
              </div>

              {authError ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p> : null}

              {authMode === "login" ? (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Celular</span>
                    <input type="tel" value={loginCelular} onChange={(e) => setLoginCelular(formatarCelular(e.target.value))} placeholder="(00) 00000-0000" className="field" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Senha</span>
                    <input type="password" value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="Sua senha" className="field" />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-[#dfe9f5] bg-[#f8fbff] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 accent-[#0079fa]"
                    />
                    <span className="text-sm text-[#0b1f33]">Manter conectado</span>
                  </label>
                  <p className="-mt-1 text-xs text-muted-foreground">{rememberMe ? "Sessão ativa por 30 dias." : "Sessão ativa por 24 horas."}</p>
                  <Button className="w-full" size="lg" onClick={entrarNaConta}>Entrar</Button>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Primeiro nome</span>
                    <input type="text" value={cadastroNome} onChange={(e) => setCadastroNome(e.target.value)} placeholder="Seu nome" className="field" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Celular</span>
                    <input type="tel" value={cadastroCelular} onChange={(e) => setCadastroCelular(formatarCelular(e.target.value))} placeholder="(00) 00000-0000" className="field" />
                    {cadastroCelular.trim() && celularEmUso ? <p className="mt-2 text-xs text-red-600">Este celular já está cadastrado.</p> : null}
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Senha</span>
                    <input type="password" value={cadastroSenha} onChange={(e) => setCadastroSenha(e.target.value)} placeholder="Crie uma senha" className="field" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-foreground">Confirmação da senha</span>
                    <input type="password" value={cadastroConfirmacao} onChange={(e) => setCadastroConfirmacao(e.target.value)} placeholder="Repita a senha" className="field" />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-[#dfe9f5] bg-[#f8fbff] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 accent-[#0079fa]"
                    />
                    <span className="text-sm text-[#0b1f33]">Manter conectado</span>
                  </label>
                  <p className="-mt-1 text-xs text-muted-foreground">{rememberMe ? "Sessão ativa por 30 dias." : "Sessão ativa por 24 horas."}</p>
                  <Button className="w-full" size="lg" onClick={criarConta}>Criar conta</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-0 py-0">
      <div className="mx-auto min-h-screen max-w-md overflow-hidden bg-[#f3f6fb] shadow-none">
        <header className="bg-[#0079fa] px-4 pb-4 pt-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu lateral" className="h-9 w-9 rounded-full text-white hover:bg-white/10">
              <Menu aria-hidden="true" />
            </Button>

            <div className="flex-1" />

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{inicialUsuario}</div>
          </div>
        </header>

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card p-4 shadow-lg transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Menu lateral"
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Menu</p>
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">✕</Button>
          </div>

          <div className="mb-5 rounded-xl bg-[#eef5ff] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0079fa]">Conta conectada</p>
            <p className="mt-2 text-base font-bold text-[#0b1f33]">{session.firstName}</p>
            <p className="text-xs text-muted-foreground">{session.celular}</p>
            <p className="mt-2 text-[11px] font-medium text-[#0b1f33]">{session.rememberMe ? "Manter conectado: ativo (30 dias)" : "Logout automático em 24 horas"}</p>
          </div>

          <nav className="space-y-2">
            <Button variant={page === "home" ? "default" : "outline"} className="w-full justify-start" onClick={() => abrirPagina("home")}>
              Início
            </Button>
            <Button variant={page === "calendar" ? "default" : "outline"} className="w-full justify-start" onClick={() => abrirPagina("calendar")}>
              <CalendarDays className="mr-2 size-4" aria-hidden="true" /> Ver calendário
            </Button>
            <Button variant={page === "settings" ? "default" : "outline"} className="w-full justify-start" onClick={() => abrirPagina("settings")}>
              <WalletCards className="mr-2 size-4" aria-hidden="true" /> Configurações
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={sairDaConta}>
              Sair da conta
            </Button>
          </nav>
        </aside>

        {menuOpen ? <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-30 bg-black/30" onClick={() => setMenuOpen(false)} /> : null}

        <div className="bg-[#f3f6fb] px-4 pb-6 pt-4">
          {page === "home" ? (
            <div className="space-y-4">
              <div ref={carouselRef} className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onScroll={handleCardScroll}>
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
                        onClick={() => selecionarCartao(cartao.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selecionarCartao(cartao.id);
                          }
                        }}
                        className={`min-w-full snap-center rounded-[22px] p-4 pb-5 text-left text-white ${cartaoAtivoId === cartao.id ? "ring-2 ring-white/80" : "opacity-90"}`}
                        style={{
                          background: `linear-gradient(135deg, ${tema.from} 0%, ${tema.via} 52%, ${tema.to} 100%)`,
                          boxShadow: `0 12px 24px ${tema.glow}`,
                          minHeight: "220px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 text-center text-[22px] font-extrabold tracking-tight sm:text-[27px]">{getNomeCartaoExibicao(cartao.nome)}</div>
                        </div>
                        <div className="mt-2">
                          <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.22em] text-white/75">Saldo</div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[27px] font-black tracking-tight sm:text-[32px]">
                              {cartao.saldoPrivado ?? true ? "R$ •••••" : `R$ ${Number(cartao.saldo.replace(",", ".")) || 0}`}
                            </div>
                            <button
                              type="button"
                              aria-label={cartao.saldoPrivado ?? true ? "Mostrar saldo" : "Ocultar saldo"}
                              className="shrink-0 rounded-full border border-white/30 bg-black/10 p-1.5 text-white/90 transition hover:bg-black/20"
                              onClick={(event) => {
                                event.stopPropagation();
                                alternarSaldoPrivado(cartao.id);
                              }}
                            >
                              {cartao.saldoPrivado ?? true ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="mt-1 text-[11px] text-white/75">Atualizado em {new Date().toLocaleDateString("pt-BR")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Custo por dia</p>
                <p className="mt-2 text-2xl font-extrabold text-[#0b1f33]">{brl(calc.custoDia)}</p>
              </div>

              <div className="rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Resumo</p>
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
                    <strong className="text-foreground">{calc.recarga ? new Date(`${calc.recarga}T00:00:00`).toLocaleDateString("pt-BR") : "—"}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {page === "calendar" ? (
          <section className="space-y-6">
            <section className="rounded-md border border-border bg-card p-4 shadow-sm md:p-7">
              <div className="mb-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft /></Button>
                <div className="min-w-0 text-center"><p className="text-xs font-bold uppercase text-primary">Calendário de viagens</p><h2 className="truncate text-lg font-bold md:text-xl">{MESES[mesRef.getMonth()]} de {mesRef.getFullYear()}</h2></div>
                <Button variant="outline" size="icon" onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight /></Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground md:gap-2">{DIAS.map((dia, i) => <div key={`${dia}-${i}`} className="py-2">{dia}</div>)}</div>
              <div className="grid grid-cols-7 gap-1 md:gap-2">
                {grade.map((d, i) => {
                  if (!d) return <div key={`vazio-${i}`} />;
                  const key = iso(d);
                  const fds = d.getDay() === 0 || d.getDay() === 6;
                  const feriado = feriados.includes(key);
                  const coberto = calc.cobertos.has(key);
                  const recarga = calc.recarga === key;
                  const estilo = recarga ? "bg-brand-warm text-brand-warm-foreground border-brand-warm font-extrabold" : coberto ? "bg-primary text-primary-foreground border-primary font-bold" : feriado ? "bg-muted text-muted-foreground line-through" : fds ? "bg-background text-muted-foreground/50" : "bg-secondary text-foreground hover:border-primary";
                  return <Button variant="outline" key={key} onClick={() => !fds && toggleFeriado(d)} disabled={fds} title={fds ? "Fim de semana" : "Clique para marcar como feriado ou folga"} className={`aspect-square h-auto min-h-9 rounded-sm p-0 text-xs md:text-sm ${estilo}`}>{d.getDate()}</Button>;
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
                <Legenda cor="bg-primary" texto="Dia pago pelo saldo" /><Legenda cor="bg-brand-warm" texto="Dia de recarregar" /><Legenda cor="bg-muted" texto="Feriado ou folga" />
              </div>
              <p className="mt-5 border-l-4 border-primary bg-brand-soft px-4 py-3 text-sm text-foreground">Neste mês, seu saldo cobre <strong>{diasAulaNoMes} dias de aula</strong>.</p>
            </section>
          </section>
        ) : null}

        {page === "settings" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="rounded-md border border-border bg-card p-5 shadow-sm md:p-7">
              <div className="mb-6 border-b border-border pb-4">
                <p className="text-xs font-bold uppercase text-primary">Configurações do cartão</p>
                <h2 className="mt-1 text-xl font-bold">Atualize seu saldo e a rotina de uso</h2>
              </div>

              <div className="mb-7 rounded-xl border border-[#dfe9f5] bg-[#f7faff] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0b1f33]">Editar cartões</p>
                    <p className="text-xs text-muted-foreground">Escolha o cartão ativo e personalize cada nome e cor.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={adicionarCartao}>+ adicionar</Button>
                </div>
                <div className="space-y-3">
                  {cartoes.map((cartao) => {
                    const tema = getCardTheme(cartao.cor);
                    return (
                      <div key={cartao.id} className={`rounded-xl border p-3 ${cartaoAtivoId === cartao.id ? "border-[#0079fa] bg-white" : "border-[#dfe9f5] bg-white/80"}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cartao.nome}
                            onChange={(e) => renomearCartao(cartao.id, e.target.value)}
                            placeholder="Cartão"
                            className="field flex-1"
                          />
                          <Button type="button" variant={cartaoAtivoId === cartao.id ? "default" : "outline"} onClick={() => selecionarCartao(cartao.id)} size="sm">
                            {cartaoAtivoId === cartao.id ? "Ativo" : "Usar"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm("Deseja excluir este cartão?")) {
                                removerCartao(cartao.id);
                              }
                            }}
                          >
                            Excluir
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {(Object.keys(CARD_THEMES) as CardColorKey[]).map((cor) => {
                            const atual = CARD_THEMES[cor];
                            const ativo = cartao.cor === cor;
                            return (
                              <button
                                key={`${cartao.id}-${cor}`}
                                type="button"
                                aria-label={`Usar cor ${atual.name}`}
                                title={atual.name}
                                onClick={() => atualizarCartaoPorId(cartao.id, { cor })}
                                className={`h-7 w-7 rounded-full border-2 transition ${ativo ? "scale-110 border-white shadow-md ring-2 ring-[#0079fa]" : "border-transparent"}`}
                                style={{
                                  background: `linear-gradient(135deg, ${atual.from} 0%, ${atual.via} 52%, ${atual.to} 100%)`,
                                  boxShadow: ativo ? `0 0 0 2px rgba(0, 121, 250, 0.25)` : undefined,
                                }}
                              />
                            );
                          })}
                        </div>

                        <p className="mt-2 text-[11px] text-muted-foreground">Cor atual: {tema.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Campo label="Valor recarregado no mês (R$)"><input aria-label="Valor recarregado no mês" type="text" inputMode="decimal" value={saldo} onChange={(e) => { setSaldo(e.target.value); atualizarCartaoAtual({ saldo: e.target.value }); }} className="field" /></Campo>
                <Campo label="Valor de cada passagem (R$)"><input aria-label="Valor de cada passagem" type="text" inputMode="decimal" value={tarifa} onChange={(e) => { setTarifa(e.target.value); atualizarCartaoAtual({ tarifa: e.target.value }); }} className="field" /></Campo>
                <Campo label="Passagens por dia de aula"><select aria-label="Passagens por dia de aula" value={viagens} onChange={(e) => { setViagens(e.target.value); atualizarCartaoAtual({ viagens: e.target.value }); }} className="field"><option value="1">1 (só ida)</option><option value="2">2 (ida e volta)</option><option value="3">3 passagens</option><option value="4">4 (2 ônibus por trecho)</option></select></Campo>
                <Campo label="Começar a contar a partir de"><input aria-label="Data inicial" type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); atualizarCartaoAtual({ inicio: e.target.value }); }} className="field" /></Campo>
              </div>

              <div className="mt-7 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">Alertar no dia final da recarga</p>
                    <p className="text-xs text-muted-foreground">Ative ou desative esse aviso do app.</p>
                  </div>
                  <Button
                    type="button"
                    variant={alertaRecargaAtivo ? "default" : "outline"}
                    onClick={() => {
                      const novoStatus = !alertaRecargaAtivo;
                      setAlertaRecargaAtivo(novoStatus);
                      atualizarCartaoAtual({ alertaRecargaAtivo: novoStatus });
                    }}
                    aria-pressed={alertaRecargaAtivo}
                    className="min-w-28"
                  >
                    {alertaRecargaAtivo ? "Ligado" : "Desligado"}
                  </Button>
                </div>
              </div>

              <div className="mt-7 rounded-lg border border-dashed border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                Suas alterações são salvas automaticamente enquanto você edita.
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span>{children}</label>;
}

function Linha({ rotulo, valor, inverse = false }: { rotulo: string; valor: string; inverse?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><span className={inverse ? "text-primary-foreground/65" : "text-muted-foreground"}>{rotulo}</span><span className="font-bold">{valor}</span></div>;
}

function Destaque({ titulo, valor, tom }: { titulo: string; valor: string; tom: "azul" | "quente" }) {
  return <div className={`rounded-md border-l-4 bg-card p-5 shadow-sm ${tom === "quente" ? "border-brand-warm" : "border-primary"}`}><p className="text-xs font-bold uppercase text-muted-foreground">{titulo}</p><p className="mt-2 text-lg font-extrabold capitalize text-foreground md:text-xl">{valor}</p></div>;
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return <span className="flex items-center gap-2"><span className={`inline-block size-3 rounded-xs ${cor}`} />{texto}</span>;
}