import processModule from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
var CAUSE_DEPTH_LIMIT = 5;
var DESCRIPTION_LENGTH_LIMIT = 8e3;
function describeError(error) {
	const parts = [];
	let current = error;
	for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
		if (!(current instanceof Error)) {
			parts.push(typeof current === "string" ? current : safeStringify(current));
			break;
		}
		const label = depth === 0 ? "" : "caused by: ";
		const status = describeStatus(current);
		parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
		current = current.cause;
	}
	return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}
function describeStatus(error) {
	const { status, statusCode } = error;
	const value = status ?? statusCode;
	return typeof value === "number" ? ` (status ${value})` : "";
}
function safeStringify(value) {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}
function isErrorLike(value) {
	return value instanceof Error;
}
var originalConsoleError = console.error.bind(console);
console.error = (...args) => {
	originalConsoleError(...args.map((arg) => {
		if (!isErrorLike(arg)) return arg;
		record(arg);
		return describeError(arg);
	}));
};
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => record(event.error ?? event));
	globalThis.addEventListener("unhandledrejection", (event) => record(event.reason));
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-BqEmi4YC.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var DATA_FILE = path.resolve(processModule.cwd(), ".data", "riocard-shared.json");
var normalizePhone = (valor) => valor.replace(/\D/g, "");
function validarCelularParaCadastro(valor) {
	const celular = normalizePhone(valor);
	if (celular.length < 11) return "Faltando o DDD. O celular precisa ter 11 dígitos, incluindo o DDD.";
	if (celular.length > 11) return "O celular deve ter exatamente 11 dígitos, incluindo o DDD.";
	return null;
}
async function ensureStore() {
	await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
	try {
		await fs.access(DATA_FILE);
	} catch {
		await fs.writeFile(DATA_FILE, JSON.stringify({
			accounts: [],
			userData: {}
		}, null, 2), "utf-8");
	}
}
async function readStore() {
	await ensureStore();
	const raw = await fs.readFile(DATA_FILE, "utf-8");
	try {
		const parsed = JSON.parse(raw);
		return {
			accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
			userData: parsed.userData && typeof parsed.userData === "object" ? parsed.userData : {}
		};
	} catch {
		return {
			accounts: [],
			userData: {}
		};
	}
}
async function writeStore(store) {
	await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}
function jsonResponse(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" }
	});
}
async function handleApi(request) {
	const url = new URL(request.url);
	if (url.pathname === "/api/auth/register" && request.method === "POST") {
		const body = await request.json().catch(() => ({}));
		const firstName = String(body.firstName ?? "").trim();
		const celular = normalizePhone(String(body.celular ?? ""));
		const password = String(body.password ?? "");
		const erroCelular = validarCelularParaCadastro(String(body.celular ?? ""));
		if (!firstName || !celular || !password) return jsonResponse({ error: "Preencha nome, celular e senha para criar a conta." }, 400);
		if (erroCelular) return jsonResponse({ error: erroCelular }, 400);
		const store = await readStore();
		if (store.accounts.some((conta) => normalizePhone(conta.celular) === celular)) return jsonResponse({ error: "Este celular já está cadastrado." }, 409);
		const novaConta = {
			firstName,
			celular,
			password
		};
		store.accounts.push(novaConta);
		await writeStore(store);
		return jsonResponse({ ...novaConta }, 201);
	}
	if (url.pathname === "/api/auth/login" && request.method === "POST") {
		const body = await request.json().catch(() => ({}));
		const celular = normalizePhone(String(body.celular ?? ""));
		const password = String(body.password ?? "");
		const erroCelular = validarCelularParaCadastro(String(body.celular ?? ""));
		if (!celular || !password) return jsonResponse({ error: "Informe o celular e a senha." }, 400);
		if (erroCelular) return jsonResponse({ error: erroCelular }, 400);
		const conta = (await readStore()).accounts.find((item) => normalizePhone(item.celular) === celular && item.password === password);
		if (!conta) return jsonResponse({ error: "Celular ou senha inválidos." }, 401);
		return jsonResponse({ ...conta });
	}
	if (url.pathname === "/api/auth/check-phone" && request.method === "GET") {
		const celular = normalizePhone(new URL(request.url).searchParams.get("celular") ?? "");
		if (!celular) return jsonResponse({ exists: false });
		return jsonResponse({ exists: (await readStore()).accounts.some((conta) => normalizePhone(conta.celular) === celular) });
	}
	if (url.pathname === "/api/user-data" && request.method === "POST") {
		const body = await request.json().catch(() => ({}));
		const celular = normalizePhone(String(body.celular ?? ""));
		if (!celular || !body.data) return jsonResponse({ error: "Dados do usuário inválidos." }, 400);
		const store = await readStore();
		store.userData[celular] = body.data;
		await writeStore(store);
		return jsonResponse({
			ok: true,
			data: store.userData[celular]
		});
	}
	if (url.pathname.startsWith("/api/user-data") && request.method === "GET") {
		const celular = normalizePhone(new URL(request.url).searchParams.get("celular") ?? "");
		const store = await readStore();
		return jsonResponse({ data: celular ? store.userData[celular] ?? {} : {} });
	}
	return jsonResponse({ error: "Endpoint não encontrado." }, 404);
}
var server_default = { async fetch(request, env, ctx) {
	try {
		if (request.url.includes("/api/")) return await handleApi(request);
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
