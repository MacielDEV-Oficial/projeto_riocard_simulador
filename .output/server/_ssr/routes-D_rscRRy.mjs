import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as CalendarDays, i as ChevronLeft, n as Menu, r as ChevronRight, t as WalletCards } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D_rscRRy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var MESES = [
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
	"Dezembro"
];
var DIAS = [
	"D",
	"S",
	"T",
	"Q",
	"Q",
	"S",
	"S"
];
var STORAGE_KEY = "riocard-planner";
var STORAGE_SESSION_KEY = "riocard-session";
var API_BASE = "/api";
var CARD_THEMES = {
	azul: {
		name: "Azul",
		from: "#0f8cff",
		via: "#0080ff",
		to: "#0069e8",
		glow: "rgba(0, 121, 250, 0.35)"
	},
	rosa: {
		name: "Rosa",
		from: "#ff5db1",
		via: "#ff2a8e",
		to: "#d8006d",
		glow: "rgba(255, 0, 140, 0.35)"
	},
	verde: {
		name: "Verde",
		from: "#27c77d",
		via: "#1ead6c",
		to: "#0f8f53",
		glow: "rgba(22, 163, 74, 0.35)"
	},
	roxo: {
		name: "Roxo",
		from: "#8b5cf6",
		via: "#7c3aed",
		to: "#5b2ecf",
		glow: "rgba(124, 58, 237, 0.35)"
	},
	laranja: {
		name: "Laranja",
		from: "#ff9f43",
		via: "#ff8a3d",
		to: "#e66a00",
		glow: "rgba(234, 88, 12, 0.35)"
	},
	cinza: {
		name: "Cinza",
		from: "#667085",
		via: "#475467",
		to: "#344054",
		glow: "rgba(71, 84, 103, 0.35)"
	}
};
var getCardTheme = (cor) => {
	return CARD_THEMES[cor && cor in CARD_THEMES ? cor : "azul"];
};
var normalizePhone = (valor) => valor.replace(/\D/g, "");
var formatarCelular = (valor) => {
	const digits = normalizePhone(valor).slice(0, 11);
	if (digits.length <= 2) return digits;
	if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};
var validarCelular = (valor) => {
	const celular = normalizePhone(valor);
	if (celular.length < 11) return "Faltando o DDD. O celular precisa ter 11 dígitos, incluindo o DDD.";
	if (celular.length > 11) return "O celular deve ter exatamente 11 dígitos, incluindo o DDD.";
	return null;
};
var getUserStorageKey = (celular) => `${STORAGE_KEY}-${normalizePhone(celular) || "usuario"}`;
var brl = (n) => n.toLocaleString("pt-BR", {
	style: "currency",
	currency: "BRL"
});
var iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
var parseData = (valor) => {
	if (!valor) return null;
	const [ano, mes, dia] = valor.split("-").map(Number);
	if (!ano || !mes || !dia) return null;
	return new Date(ano, mes - 1, dia);
};
async function apiRequest(path, init) {
	const response = await fetch(`${API_BASE}${path}`, {
		headers: { "Content-Type": "application/json" },
		...init
	});
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(payload.error || "Operação falhou.");
	return payload;
}
function RioBrand({ small = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: `${small ? "text-lg" : "text-[2rem]"} font-light tracking-[-0.06em] leading-none`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[#0085fa]",
					children: "RioCard"
				}),
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[#ff008c]",
					children: "Mais"
				})
			]
		})
	});
}
function Index() {
	const hoje = /* @__PURE__ */ new Date();
	const [saldo, setSaldo] = (0, import_react.useState)("100");
	const [tarifa, setTarifa] = (0, import_react.useState)("4.70");
	const [viagens, setViagens] = (0, import_react.useState)("2");
	const [inicio, setInicio] = (0, import_react.useState)(iso(hoje));
	const [feriados, setFeriados] = (0, import_react.useState)([]);
	const [page, setPage] = (0, import_react.useState)("home");
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const [mesRef, setMesRef] = (0, import_react.useState)(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
	const [cartoes, setCartoes] = (0, import_react.useState)([]);
	const [cartaoAtivoId, setCartaoAtivoId] = (0, import_react.useState)(null);
	const [alertaRecargaAtivo, setAlertaRecargaAtivo] = (0, import_react.useState)(true);
	const [notificacaoPermissao, setNotificacaoPermissao] = (0, import_react.useState)("unsupported");
	const [installPrompt, setInstallPrompt] = (0, import_react.useState)(null);
	const [session, setSession] = (0, import_react.useState)(null);
	const [authMode, setAuthMode] = (0, import_react.useState)("login");
	const [loginCelular, setLoginCelular] = (0, import_react.useState)("");
	const [loginSenha, setLoginSenha] = (0, import_react.useState)("");
	const [cadastroNome, setCadastroNome] = (0, import_react.useState)("");
	const [cadastroCelular, setCadastroCelular] = (0, import_react.useState)("");
	const [cadastroSenha, setCadastroSenha] = (0, import_react.useState)("");
	const [cadastroConfirmacao, setCadastroConfirmacao] = (0, import_react.useState)("");
	const [authError, setAuthError] = (0, import_react.useState)("");
	const [celularEmUso, setCelularEmUso] = (0, import_react.useState)(false);
	const carouselRef = (0, import_react.useRef)(null);
	const cardRefs = (0, import_react.useRef)({});
	const ultimaNotificacaoRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const onBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setInstallPrompt(event);
		};
		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		try {
			const rawSession = localStorage.getItem(STORAGE_SESSION_KEY);
			if (!rawSession) return;
			const savedSession = JSON.parse(rawSession);
			if (savedSession?.celular && savedSession?.firstName) setSession(savedSession);
		} catch {}
	}, []);
	const aplicarCartaoAtivo = (cartao) => {
		if (!cartao) return;
		setSaldo(cartao.saldo);
		setTarifa(cartao.tarifa);
		setViagens(cartao.viagens);
		setInicio(cartao.inicio);
		setFeriados(cartao.feriados);
		setAlertaRecargaAtivo(cartao.alertaRecargaAtivo);
	};
	const atualizarCartaoAtual = (updates) => {
		if (!cartaoAtivoId) return;
		setCartoes((lista) => lista.map((cartao) => cartao.id === cartaoAtivoId ? {
			...cartao,
			...updates
		} : cartao));
	};
	const atualizarCartaoPorId = (id, updates) => {
		setCartoes((lista) => lista.map((cartao) => cartao.id === id ? {
			...cartao,
			...updates
		} : cartao));
	};
	const criarCartaoPadrao = (nome = "Cartão principal", overrides = {}) => ({
		id: `cartao-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
		nome,
		saldo: "100",
		tarifa: "4.70",
		viagens: "2",
		inicio: iso(hoje),
		feriados: [],
		alertaRecargaAtivo: true,
		cor: "azul",
		...overrides
	});
	const carregarDadosDoUsuario = async (usuario) => {
		try {
			const salvo = (await apiRequest("/user-data?celular=" + encodeURIComponent(usuario.celular))).data ?? {};
			const cardsRaw = Array.isArray(salvo.cards) ? salvo.cards : [];
			if (cardsRaw.length > 0) {
				const normalizedCards = cardsRaw.map((card, index) => ({
					id: String(card.id ?? `cartao-${index + 1}`),
					nome: String(card.nome ?? `Cartão ${index + 1}`),
					saldo: String(card.saldo ?? "100"),
					tarifa: String(card.tarifa ?? "4.70"),
					viagens: String(card.viagens ?? "2"),
					inicio: String(card.inicio ?? iso(hoje)),
					feriados: Array.isArray(card.feriados) ? card.feriados : [],
					alertaRecargaAtivo: typeof card.alertaRecargaAtivo === "boolean" ? card.alertaRecargaAtivo : true,
					cor: typeof card.cor === "string" && card.cor in CARD_THEMES ? card.cor : "azul"
				}));
				setCartoes(normalizedCards);
				const activeId = typeof salvo.activeCardId === "string" && normalizedCards.some((item) => item.id === salvo.activeCardId) ? salvo.activeCardId : normalizedCards[0]?.id ?? null;
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
				feriados: Array.isArray(salvo.feriados) ? salvo.feriados : [],
				alertaRecargaAtivo: typeof salvo.alertaRecargaAtivo === "boolean" ? salvo.alertaRecargaAtivo : true
			});
			setCartoes([legacyCard]);
			setCartaoAtivoId(legacyCard.id);
			aplicarCartaoAtivo(legacyCard);
		} catch {
			try {
				const userKey = getUserStorageKey(usuario.celular);
				const raw = localStorage.getItem(userKey);
				if (!raw) return;
				const salvo = JSON.parse(raw);
				const cardsRaw = Array.isArray(salvo.cards) ? salvo.cards : [];
				if (cardsRaw.length > 0) {
					const normalizedCards = cardsRaw.map((card, index) => ({
						id: String(card.id ?? `cartao-${index + 1}`),
						nome: String(card.nome ?? `Cartão ${index + 1}`),
						saldo: String(card.saldo ?? "100"),
						tarifa: String(card.tarifa ?? "4.70"),
						viagens: String(card.viagens ?? "2"),
						inicio: String(card.inicio ?? iso(hoje)),
						feriados: Array.isArray(card.feriados) ? card.feriados : [],
						alertaRecargaAtivo: typeof card.alertaRecargaAtivo === "boolean" ? card.alertaRecargaAtivo : true,
						cor: typeof card.cor === "string" && card.cor in CARD_THEMES ? card.cor : "azul"
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
					feriados: Array.isArray(salvo.feriados) ? salvo.feriados : [],
					alertaRecargaAtivo: typeof salvo.alertaRecargaAtivo === "boolean" ? salvo.alertaRecargaAtivo : true
				});
				setCartoes([fallbackCard]);
				setCartaoAtivoId(fallbackCard.id);
				aplicarCartaoAtivo(fallbackCard);
			} catch {}
		}
	};
	(0, import_react.useEffect)(() => {
		if (!session) return;
		carregarDadosDoUsuario(session);
	}, [session]);
	(0, import_react.useEffect)(() => {
		const celular = normalizePhone(cadastroCelular);
		if (celular.length !== 11) {
			setCelularEmUso(false);
			return;
		}
		let ativo = true;
		apiRequest("/auth/check-phone?celular=" + encodeURIComponent(celular)).then((response) => {
			if (ativo) setCelularEmUso(Boolean(response.exists));
		}).catch(() => {
			if (ativo) setCelularEmUso(false);
		});
		return () => {
			ativo = false;
		};
	}, [cadastroCelular]);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		if (!("Notification" in window)) {
			setNotificacaoPermissao("unsupported");
			return;
		}
		setNotificacaoPermissao(Notification.permission);
	}, []);
	const salvarConfiguracoes = async () => {
		if (!session) {
			toast.error("Faça login para salvar seus dados.");
			return;
		}
		const listaCartoes = cartoes.map((cartao) => {
			if (cartao.id !== cartaoAtivoId) return cartao;
			return {
				...cartao,
				saldo,
				tarifa,
				viagens,
				inicio,
				feriados,
				alertaRecargaAtivo
			};
		});
		const payload = {
			cards: listaCartoes,
			activeCardId: cartaoAtivoId
		};
		try {
			const userKey = getUserStorageKey(session.celular);
			await apiRequest("/user-data", {
				method: "POST",
				body: JSON.stringify({
					celular: session.celular,
					data: payload
				})
			});
			localStorage.setItem(userKey, JSON.stringify(payload));
			localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
			setCartoes(listaCartoes);
			toast.success("Configurações salvas");
			setPage("home");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
		}
	};
	const abrirPagina = (novaPagina) => {
		setPage(novaPagina);
		setMenuOpen(false);
	};
	const selecionarCartao = (id) => {
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
		if (cartao && cartao.id !== cartaoAtivoId) selecionarCartao(cartao.id);
	};
	const adicionarCartao = () => {
		const proximoNumero = cartoes.length + 1;
		const novoCartao = criarCartaoPadrao(`Cartão ${proximoNumero}`);
		setCartoes((lista) => [...lista, novoCartao]);
		setCartaoAtivoId(novoCartao.id);
		aplicarCartaoAtivo(novoCartao);
	};
	const renomearCartao = (id, nome) => {
		const valor = nome.trim() || "Cartão";
		setCartoes((lista) => lista.map((cartao) => cartao.id === id ? {
			...cartao,
			nome: valor
		} : cartao));
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
			const conta = await apiRequest("/auth/login", {
				method: "POST",
				body: JSON.stringify({
					celular,
					password: loginSenha
				})
			});
			localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(conta));
			setSession(conta);
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
			const novaConta = await apiRequest("/auth/register", {
				method: "POST",
				body: JSON.stringify({
					firstName: nome,
					celular,
					password: senha
				})
			});
			localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(novaConta));
			setSession(novaConta);
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
	const calc = (0, import_react.useMemo)(() => {
		const valor = Number(saldo.replace(",", ".")) || 0;
		const custoDia = (Number(tarifa.replace(",", ".")) || 0) * (Number(viagens) || 0);
		const partesInicio = inicio.split("-").map(Number);
		const dataInicio = new Date(partesInicio[0] || 1970, (partesInicio[1] || 1) - 1, partesInicio[2] || 1);
		const diasCobertos = custoDia > 0 ? Math.floor(valor / custoDia) : 0;
		const sobra = custoDia > 0 ? valor - diasCobertos * custoDia : valor;
		const cobertos = [];
		const cursor = new Date(dataInicio);
		let guard = 0;
		while (cobertos.length < diasCobertos && guard < 2e3) {
			if (cursor.getDay() >= 1 && cursor.getDay() <= 5 && !feriados.includes(iso(cursor))) cobertos.push(iso(cursor));
			cursor.setDate(cursor.getDate() + 1);
			guard++;
		}
		let recarga = null;
		guard = 0;
		while (!recarga && guard < 2e3) {
			if (cursor.getDay() >= 1 && cursor.getDay() <= 5 && !feriados.includes(iso(cursor))) recarga = iso(cursor);
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
			totalGasto: diasCobertos * custoDia
		};
	}, [
		saldo,
		tarifa,
		viagens,
		inicio,
		feriados
	]);
	const grade = (0, import_react.useMemo)(() => {
		const ano = mesRef.getFullYear();
		const mes = mesRef.getMonth();
		const cells = Array.from({ length: new Date(ano, mes, 1).getDay() }, () => null);
		for (let dia = 1; dia <= new Date(ano, mes + 1, 0).getDate(); dia++) cells.push(new Date(ano, mes, dia));
		return cells;
	}, [mesRef]);
	const formatarData = (valor) => {
		if (!valor) return "—";
		const [ano, mes, dia] = valor.split("-").map(Number);
		return new Date(ano || 1970, (mes || 1) - 1, dia || 1).toLocaleDateString("pt-BR", {
			weekday: "long",
			day: "2-digit",
			month: "long"
		});
	};
	const alertaRecarga = (0, import_react.useMemo)(() => {
		const dataRecarga = parseData(calc.recarga);
		const dataUltimoDia = parseData(calc.ultimoDia);
		if (!dataRecarga) return null;
		const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
		const dataRecargaSemHora = new Date(dataRecarga.getFullYear(), dataRecarga.getMonth(), dataRecarga.getDate());
		const diffDias = Math.round((dataRecargaSemHora.getTime() - hojeSemHora.getTime()) / 864e5);
		if (hojeSemHora.getTime() === dataRecargaSemHora.getTime()) return {
			chave: `${calc.recarga}-hoje`,
			titulo: "Hoje é dia de recarga",
			mensagem: `Seu saldo vai acabar hoje. Recarregue antes de ${formatarData(calc.recarga)} para continuar usando o cartão.`
		};
		if (diffDias === 1) return {
			chave: `${calc.recarga}-amanha`,
			titulo: "Saldo vai acabar em 1 dia",
			mensagem: `Você ainda tem saldo até ${formatarData(calc.ultimoDia)}. Recarregue até ${formatarData(calc.recarga)} antes de perder o benefício.`
		};
		if (dataUltimoDia && hojeSemHora.getTime() >= dataUltimoDia.getTime() && hojeSemHora.getTime() <= dataRecargaSemHora.getTime()) return {
			chave: `${calc.recarga}-ultimo-dia`,
			titulo: "Seu saldo está acabando",
			mensagem: `O último dia com saldo é ${formatarData(calc.ultimoDia)} e a recarga deve ser feita até ${formatarData(calc.recarga)}.`
		};
		return null;
	}, [
		calc.recarga,
		calc.ultimoDia,
		hoje
	]);
	(0, import_react.useEffect)(() => {
		if (!alertaRecargaAtivo) {
			ultimaNotificacaoRef.current = null;
			return;
		}
		if (!alertaRecarga || !alertaRecarga.chave) return;
		if (ultimaNotificacaoRef.current === alertaRecarga.chave) return;
		ultimaNotificacaoRef.current = alertaRecarga.chave;
		toast.warning(alertaRecarga.titulo, {
			description: alertaRecarga.mensagem,
			duration: 8e3
		});
		if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") new Notification(alertaRecarga.titulo, {
			body: alertaRecarga.mensagem,
			icon: "/favicon.png"
		});
	}, [alertaRecarga, alertaRecargaAtivo]);
	const diasAulaNoMes = grade.filter((d) => d && calc.cobertos.has(iso(d))).length;
	const mudarMes = (delta) => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
	const toggleFeriado = (d) => setFeriados((lista) => lista.includes(iso(d)) ? lista.filter((item) => item !== iso(d)) : [...lista, iso(d)]);
	const inicialUsuario = (session?.firstName?.trim().charAt(0) || "U").toUpperCase();
	(0, import_react.useEffect)(() => {
		if (!cartaoAtivoId || !carouselRef.current) return;
		const card = cardRefs.current[cartaoAtivoId];
		if (card) card.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest"
		});
	}, [cartaoAtivoId, cartoes]);
	if (!session) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-[#f3f6fb] px-0 py-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto min-h-screen max-w-md overflow-hidden bg-[#f3f6fb] shadow-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pb-4 pt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RioBrand, {})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-[#f3f6fb] px-4 pb-8 pt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[22px] bg-white p-5 shadow-sm ring-1 ring-[#dfe9f5]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-bold uppercase tracking-[0.2em] text-[#0079fa]",
							children: "Acesso"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 text-2xl font-black text-[#0b1f33]",
							children: "Entre na sua conta"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "Todos os dados do app ficam vinculados à conta logada."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex rounded-xl bg-[#eef5ff] p-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAuthMode("login"),
								className: `flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${authMode === "login" ? "bg-white text-[#0079fa] shadow-sm" : "text-muted-foreground"}`,
								children: "Entrar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAuthMode("register"),
								className: `flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${authMode === "register" ? "bg-white text-[#0079fa] shadow-sm" : "text-muted-foreground"}`,
								children: "Cadastrar"
							})]
						}),
						authError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700",
							children: authError
						}) : null,
						authMode === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-semibold text-foreground",
										children: "Celular"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "tel",
										value: loginCelular,
										onChange: (e) => setLoginCelular(formatarCelular(e.target.value)),
										placeholder: "(00) 00000-0000",
										className: "field"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-semibold text-foreground",
										children: "Senha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										value: loginSenha,
										onChange: (e) => setLoginSenha(e.target.value),
										placeholder: "Sua senha",
										className: "field"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									size: "lg",
									onClick: entrarNaConta,
									children: "Entrar"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-semibold text-foreground",
										children: "Primeiro nome"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: cadastroNome,
										onChange: (e) => setCadastroNome(e.target.value),
										placeholder: "Seu nome",
										className: "field"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mb-2 block text-sm font-semibold text-foreground",
											children: "Celular"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "tel",
											value: cadastroCelular,
											onChange: (e) => setCadastroCelular(formatarCelular(e.target.value)),
											placeholder: "(00) 00000-0000",
											className: "field"
										}),
										cadastroCelular.trim() && celularEmUso ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs text-red-600",
											children: "Este celular já está cadastrado."
										}) : null
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-semibold text-foreground",
										children: "Senha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										value: cadastroSenha,
										onChange: (e) => setCadastroSenha(e.target.value),
										placeholder: "Crie uma senha",
										className: "field"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-2 block text-sm font-semibold text-foreground",
										children: "Confirmação da senha"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "password",
										value: cadastroConfirmacao,
										onChange: (e) => setCadastroConfirmacao(e.target.value),
										placeholder: "Repita a senha",
										className: "field"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full",
									size: "lg",
									onClick: criarConta,
									children: "Criar conta"
								})
							]
						})
					]
				})
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-[#f3f6fb] px-0 py-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto min-h-screen max-w-md overflow-hidden bg-[#f3f6fb] shadow-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "bg-[#0079fa] px-4 pb-4 pt-3 text-white",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => setMenuOpen((open) => !open),
								"aria-label": "Abrir menu lateral",
								className: "h-9 w-9 rounded-full text-white hover:bg-white/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { "aria-hidden": "true" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold",
								children: inicialUsuario
							})
						]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: `fixed inset-y-0 left-0 z-40 w-72 border-r border-border bg-card p-4 shadow-lg transition-transform duration-200 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`,
					"aria-label": "Menu lateral",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold uppercase tracking-wide text-primary",
								children: "Menu"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								onClick: () => setMenuOpen(false),
								"aria-label": "Fechar menu",
								children: "✕"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-5 rounded-xl bg-[#eef5ff] p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-bold uppercase tracking-[0.18em] text-[#0079fa]",
									children: "Conta conectada"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-base font-bold text-[#0b1f33]",
									children: session.firstName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground",
									children: session.celular
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: page === "home" ? "default" : "outline",
									className: "w-full justify-start",
									onClick: () => abrirPagina("home"),
									children: "Início"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: page === "calendar" ? "default" : "outline",
									className: "w-full justify-start",
									onClick: () => abrirPagina("calendar"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
										className: "mr-2 size-4",
										"aria-hidden": "true"
									}), " Ver calendário"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: page === "settings" ? "default" : "outline",
									className: "w-full justify-start",
									onClick: () => abrirPagina("settings"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, {
										className: "mr-2 size-4",
										"aria-hidden": "true"
									}), " Configurações"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									className: "w-full justify-start",
									onClick: sairDaConta,
									children: "Sair da conta"
								})
							]
						})
					]
				}),
				menuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Fechar menu",
					className: "fixed inset-0 z-30 bg-black/30",
					onClick: () => setMenuOpen(false)
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-[#f3f6fb] px-4 pb-6 pt-4",
					children: page === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: carouselRef,
								className: "-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
								onScroll: handleCardScroll,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-3",
									children: cartoes.map((cartao) => {
										const tema = getCardTheme(cartao.cor);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											ref: (element) => {
												cardRefs.current[cartao.id] = element;
											},
											type: "button",
											onClick: () => selecionarCartao(cartao.id),
											className: `min-w-full snap-center rounded-[22px] p-4 text-left text-white ${cartaoAtivoId === cartao.id ? "ring-2 ring-white/80" : "opacity-90"}`,
											style: {
												background: `linear-gradient(135deg, ${tema.from} 0%, ${tema.via} 52%, ${tema.to} 100%)`,
												boxShadow: `0 12px 24px ${tema.glow}`
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/80",
													children: "Saldo cartão digital"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-2 text-center text-lg font-extrabold tracking-tight",
													children: cartao.nome
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-6 text-3xl font-black tracking-tight",
													children: ["R$ ", Number(cartao.saldo.replace(",", ".")) || 0]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-2 text-xs text-white/75",
													children: ["Atualizado em ", (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR")]
												})
											]
										}, cartao.id);
									})
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
									children: "Custo por dia"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-2xl font-extrabold text-[#0b1f33]",
									children: brl(calc.custoDia)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-[18px] border border-[#dfe9f5] bg-white p-4 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
									children: "Resumo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 space-y-3 text-sm text-[#0b1f33]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Dias de aula"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [calc.diasCobertos, " dias"] })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Total usado"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: brl(calc.totalGasto) })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted-foreground",
												children: "Sobra"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: brl(calc.sobra) })]
										})
									]
								})]
							})
						]
					}) : null
				}),
				page === "calendar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "space-y-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-md border border-border bg-card p-4 shadow-sm md:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "icon",
										onClick: () => mudarMes(-1),
										"aria-label": "Mês anterior",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs font-bold uppercase text-primary",
											children: "Calendário de viagens"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
											className: "truncate text-lg font-bold md:text-xl",
											children: [
												MESES[mesRef.getMonth()],
												" de ",
												mesRef.getFullYear()
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										size: "icon",
										onClick: () => mudarMes(1),
										"aria-label": "Próximo mês",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground md:gap-2",
								children: DIAS.map((dia, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "py-2",
									children: dia
								}, `${dia}-${i}`))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-7 gap-1 md:gap-2",
								children: grade.map((d, i) => {
									if (!d) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}, `vazio-${i}`);
									const key = iso(d);
									const fds = d.getDay() === 0 || d.getDay() === 6;
									const feriado = feriados.includes(key);
									const coberto = calc.cobertos.has(key);
									const estilo = calc.recarga === key ? "bg-brand-warm text-brand-warm-foreground border-brand-warm font-extrabold" : coberto ? "bg-primary text-primary-foreground border-primary font-bold" : feriado ? "bg-muted text-muted-foreground line-through" : fds ? "bg-background text-muted-foreground/50" : "bg-secondary text-foreground hover:border-primary";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										variant: "outline",
										onClick: () => !fds && toggleFeriado(d),
										disabled: fds,
										title: fds ? "Fim de semana" : "Clique para marcar como feriado ou folga",
										className: `aspect-square h-auto min-h-9 rounded-sm p-0 text-xs md:text-sm ${estilo}`,
										children: d.getDate()
									}, key);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 flex flex-wrap gap-x-5 gap-y-3 border-t border-border pt-5 text-xs text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legenda, {
										cor: "bg-primary",
										texto: "Dia pago pelo saldo"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legenda, {
										cor: "bg-brand-warm",
										texto: "Dia de recarregar"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legenda, {
										cor: "bg-muted",
										texto: "Feriado ou folga"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-5 border-l-4 border-primary bg-brand-soft px-4 py-3 text-sm text-foreground",
								children: [
									"Neste mês, seu saldo cobre ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [diasAulaNoMes, " dias de aula"] }),
									"."
								]
							})
						]
					})
				}) : null,
				page === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid gap-6 lg:grid-cols-[1fr_340px]",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-md border border-border bg-card p-5 shadow-sm md:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 border-b border-border pb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold uppercase text-primary",
									children: "Configurações do cartão"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 text-xl font-bold",
									children: "Atualize seu saldo e a rotina de uso"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-7 rounded-xl border border-[#dfe9f5] bg-[#f7faff] p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-[#0b1f33]",
										children: "Editar cartões"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										onClick: adicionarCartao,
										children: "+ adicionar"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: cartoes.map((cartao) => {
										const tema = getCardTheme(cartao.cor);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `rounded-xl border p-3 ${cartaoAtivoId === cartao.id ? "border-[#0079fa] bg-white" : "border-[#dfe9f5] bg-white/80"}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "text",
														value: cartao.nome,
														onChange: (e) => renomearCartao(cartao.id, e.target.value),
														className: "field flex-1"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														type: "button",
														variant: cartaoAtivoId === cartao.id ? "default" : "outline",
														onClick: () => selecionarCartao(cartao.id),
														size: "sm",
														children: cartaoAtivoId === cartao.id ? "Ativo" : "Usar"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-3 flex flex-wrap items-center gap-2",
													children: Object.keys(CARD_THEMES).map((cor) => {
														const atual = CARD_THEMES[cor];
														const ativo = cartao.cor === cor;
														return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															"aria-label": `Usar cor ${atual.name}`,
															title: atual.name,
															onClick: () => atualizarCartaoPorId(cartao.id, { cor }),
															className: `h-7 w-7 rounded-full border-2 transition ${ativo ? "scale-110 border-white shadow-md ring-2 ring-[#0079fa]" : "border-transparent"}`,
															style: {
																background: `linear-gradient(135deg, ${atual.from} 0%, ${atual.via} 52%, ${atual.to} 100%)`,
																boxShadow: ativo ? `0 0 0 2px rgba(0, 121, 250, 0.25)` : void 0
															}
														}, `${cartao.id}-${cor}`);
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-2 text-[11px] text-muted-foreground",
													children: ["Cor atual: ", tema.name]
												})
											]
										}, cartao.id);
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-5 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Campo, {
										label: "Valor recarregado no mês (R$)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": "Valor recarregado no mês",
											type: "text",
											inputMode: "decimal",
											value: saldo,
											onChange: (e) => {
												setSaldo(e.target.value);
												atualizarCartaoAtual({ saldo: e.target.value });
											},
											className: "field"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Campo, {
										label: "Valor de cada passagem (R$)",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": "Valor de cada passagem",
											type: "text",
											inputMode: "decimal",
											value: tarifa,
											onChange: (e) => {
												setTarifa(e.target.value);
												atualizarCartaoAtual({ tarifa: e.target.value });
											},
											className: "field"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Campo, {
										label: "Passagens por dia de aula",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											"aria-label": "Passagens por dia de aula",
											value: viagens,
											onChange: (e) => {
												setViagens(e.target.value);
												atualizarCartaoAtual({ viagens: e.target.value });
											},
											className: "field",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "1",
													children: "1 (só ida)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "2",
													children: "2 (ida e volta)"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "3",
													children: "3 passagens"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "4",
													children: "4 (2 ônibus por trecho)"
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Campo, {
										label: "Começar a contar a partir de",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											"aria-label": "Data inicial",
											type: "date",
											value: inicio,
											onChange: (e) => {
												setInicio(e.target.value);
												atualizarCartaoAtual({ inicio: e.target.value });
											},
											className: "field"
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-7 rounded-xl border border-border bg-muted/30 p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-bold text-foreground",
										children: "Alertar no dia final da recarga"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Ative ou desative esse aviso do app."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: alertaRecargaAtivo ? "default" : "outline",
										onClick: () => {
											const novoStatus = !alertaRecargaAtivo;
											setAlertaRecargaAtivo(novoStatus);
											atualizarCartaoAtual({ alertaRecargaAtivo: novoStatus });
										},
										"aria-pressed": alertaRecargaAtivo,
										className: "min-w-28",
										children: alertaRecargaAtivo ? "Ligado" : "Desligado"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-7 flex justify-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "lg",
									onClick: salvarConfiguracoes,
									children: "Salvar dados"
								})
							})
						]
					})
				}) : null
			]
		})
	});
}
function Campo({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-2 block text-sm font-semibold text-foreground",
			children: label
		}), children]
	});
}
function Legenda({ cor, texto }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `inline-block size-3 rounded-xs ${cor}` }), texto]
	});
}
//#endregion
export { Index as component };
