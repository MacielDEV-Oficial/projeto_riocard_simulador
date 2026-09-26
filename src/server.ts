import "./lib/error-capture";

import fs from "node:fs/promises";
import path from "node:path";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const DATA_FILE = path.resolve(process.cwd(), ".data", "riocard-shared.json");

type SharedAccount = {
  firstName: string;
  celular: string;
  password: string;
};

type SharedStore = {
  accounts: SharedAccount[];
  userData: Record<string, Record<string, unknown>>;
};

const normalizePhone = (valor: string) => valor.replace(/\D/g, "");

function validarCelularParaCadastro(valor: string) {
  const celular = normalizePhone(valor);

  if (celular.length < 11) {
    return "Faltando o DDD. O celular precisa ter 11 dígitos, incluindo o DDD.";
  }

  if (celular.length > 11) {
    return "O celular deve ter exatamente 11 dígitos, incluindo o DDD.";
  }

  return null;
}

async function ensureStore() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialStore: SharedStore = { accounts: [], userData: {} };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialStore, null, 2), "utf-8");
  }
}

async function readStore(): Promise<SharedStore> {
  await ensureStore();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<SharedStore>;
    return {
      accounts: Array.isArray(parsed.accounts) ? (parsed.accounts as SharedAccount[]) : [],
      userData: parsed.userData && typeof parsed.userData === "object" ? (parsed.userData as Record<string, Record<string, unknown>>) : {},
    };
  } catch {
    return { accounts: [], userData: {} };
  }
}

async function writeStore(store: SharedStore) {
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Partial<SharedAccount>;
    const firstName = String(body.firstName ?? "").trim();
    const celular = normalizePhone(String(body.celular ?? ""));
    const password = String(body.password ?? "");
    const erroCelular = validarCelularParaCadastro(String(body.celular ?? ""));

    if (!firstName || !celular || !password) {
      return jsonResponse({ error: "Preencha nome, celular e senha para criar a conta." }, 400);
    }

    if (erroCelular) {
      return jsonResponse({ error: erroCelular }, 400);
    }

    const store = await readStore();
    const jaExiste = store.accounts.some((conta) => normalizePhone(conta.celular) === celular);
    if (jaExiste) {
      return jsonResponse({ error: "Este celular já está cadastrado." }, 409);
    }

    const novaConta: SharedAccount = { firstName, celular, password };
    store.accounts.push(novaConta);
    await writeStore(store);
    return jsonResponse({ ...novaConta }, 201);
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Partial<SharedAccount>;
    const celular = normalizePhone(String(body.celular ?? ""));
    const password = String(body.password ?? "");
    const erroCelular = validarCelularParaCadastro(String(body.celular ?? ""));

    if (!celular || !password) {
      return jsonResponse({ error: "Informe o celular e a senha." }, 400);
    }

    if (erroCelular) {
      return jsonResponse({ error: erroCelular }, 400);
    }

    const store = await readStore();
    const conta = store.accounts.find((item) => normalizePhone(item.celular) === celular && item.password === password);
    if (!conta) {
      return jsonResponse({ error: "Celular ou senha inválidos." }, 401);
    }

    return jsonResponse({ ...conta });
  }

  if (url.pathname === "/api/auth/check-phone" && request.method === "GET") {
    const celular = normalizePhone(new URL(request.url).searchParams.get("celular") ?? "");
    if (!celular) {
      return jsonResponse({ exists: false });
    }

    const store = await readStore();
    const exists = store.accounts.some((conta) => normalizePhone(conta.celular) === celular);
    return jsonResponse({ exists });
  }

  if (url.pathname === "/api/user-data" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { celular?: string; data?: Record<string, unknown> };
    const celular = normalizePhone(String(body.celular ?? ""));
    if (!celular || !body.data) {
      return jsonResponse({ error: "Dados do usuário inválidos." }, 400);
    }

    const store = await readStore();
    store.userData[celular] = body.data;
    await writeStore(store);
    return jsonResponse({ ok: true, data: store.userData[celular] });
  }

  if (url.pathname.startsWith("/api/user-data") && request.method === "GET") {
    const celular = normalizePhone(new URL(request.url).searchParams.get("celular") ?? "");
    const store = await readStore();
    return jsonResponse({ data: celular ? store.userData[celular] ?? {} : {} });
  }

  return jsonResponse({ error: "Endpoint não encontrado." }, 404);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      if (request.url.includes("/api/")) {
        return await handleApi(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
