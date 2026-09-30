import dotenv from "dotenv";

dotenv.config({ path: [".env.neon", ".env"] });

import { createHash, randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import bcrypt from "bcryptjs";

type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  celular: string;
  role: "client" | "admin";
  roleId: number;
};

type JsonRecord = Record<string, unknown>;

let pool: Pool | undefined;
const DAY_MS = 24 * 60 * 60 * 1000;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = connectionString
      ? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 })
      : new Pool({
          host: process.env.DB_HOST ?? "localhost",
          port: Number(process.env.DB_PORT ?? 5432),
          database: process.env.DB_NAME ?? "riocard",
          user: process.env.DB_USER ?? "riocard_user",
          password: process.env.DB_PASSWORD,
          max: 10,
          idleTimeoutMillis: 30_000,
        });
  }
  return pool;
}

const normalizePhone = (value: string) => value.replace(/\D/g, "");
const normalizeEmail = (value: string) => value.trim().toLowerCase();
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  responseHeaders.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=") || null;
  }
  return null;
}

function sessionCookie(
  request: Request,
  token: string,
  maxAge: number,
): string {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const isHttps =
    new URL(request.url).protocol === "https:" ||
    (process.env.RENDER === "true" && forwardedProtocol === "https");
  const secure = isHttps ? "; Secure" : "";
  return `riocard_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function clearSessionCookie(request: Request): string {
  return sessionCookie(request, "", 0);
}

function publicUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    firstName: user.name,
    name: user.name,
    email: user.email,
    celular: user.celular,
    role: user.role,
    roleId: user.roleId,
  };
}

async function getAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const token = getCookie(request, "riocard_session");
  if (!token) return null;
  const result = await getPool().query<{
    id: string;
    name: string;
    email: string;
    celular: string;
    role: "client" | "admin";
    role_id: number;
  }>(
    `SELECT u.id, u.name, u.email, u.celular, r.name AS role, u.role_id
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN roles r ON r.id = u.role_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashToken(token)],
  );
  const user = result.rows[0];
  return user ? { ...user, roleId: user.role_id } : null;
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidEmail(email: string) {
  return email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function createSession(
  client: PoolClient,
  userId: string,
  rememberMe: boolean,
) {
  const token = randomBytes(32).toString("base64url");
  const ttlMs = (rememberMe ? 30 : 1) * DAY_MS;
  await client.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 millisecond'))",
    [userId, hashToken(token), ttlMs],
  );
  return {
    token,
    ttlSeconds: Math.floor(ttlMs / 1000),
    expiresAt: Date.now() + ttlMs,
  };
}

async function register(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => ({}));
  const data = isJsonRecord(body) ? body : {};
  const name = String(data.firstName ?? data.name ?? "").trim();
  const email = normalizeEmail(String(data.email ?? ""));
  const celular = normalizePhone(String(data.celular ?? ""));
  const password = String(data.password ?? "");
  const rememberMe = data.rememberMe === true;

  if (!name || name.length > 120)
    return jsonResponse(
      { error: "Informe um nome válido (até 120 caracteres)." },
      400,
    );
  if (invalidEmail(email))
    return jsonResponse({ error: "Informe um email válido." }, 400);
  if (celular.length !== 11)
    return jsonResponse(
      { error: "O celular precisa ter 11 dígitos, incluindo o DDD." },
      400,
    );
  if (password.length < 8 || password.length > 72)
    return jsonResponse(
      { error: "A senha precisa ter entre 8 e 72 caracteres." },
      400,
    );

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const role = await client.query<{ id: number }>(
      "SELECT id FROM roles WHERE name = 'client'",
    );
    if (!role.rows[0])
      throw new Error(
        "A role client não foi inicializada. Execute npm run db:init.",
      );
    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await client.query<{ id: string }>(
      "INSERT INTO users (name, email, celular, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, celular, passwordHash, role.rows[0].id],
    );
    const session = await createSession(
      client,
      inserted.rows[0]!.id,
      rememberMe,
    );
    await client.query("COMMIT");
    const user = await getPool().query<{
      id: string;
      name: string;
      email: string;
      celular: string;
      role: "client" | "admin";
      role_id: number;
    }>(
      "SELECT u.id, u.name, u.email, u.celular, r.name AS role, u.role_id FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1",
      [inserted.rows[0]!.id],
    );
    return jsonResponse(
      { user: publicUser({ ...user.rows[0]!, roleId: user.rows[0]!.role_id }) },
      201,
      {
        "set-cookie": sessionCookie(request, session.token, session.ttlSeconds),
      },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    if (isPgUniqueViolation(error))
      return jsonResponse(
        { error: "Este email ou celular já está cadastrado." },
        409,
      );
    throw error;
  } finally {
    client.release();
  }
}

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

async function login(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => ({}));
  const data = isJsonRecord(body) ? body : {};
  const identifier = String(
    data.identifier ?? data.email ?? data.celular ?? "",
  ).trim();
  const password = String(data.password ?? "");
  const rememberMe = data.rememberMe === true;
  if (!identifier || !password)
    return jsonResponse({ error: "Informe email ou celular e senha." }, 400);

  const isEmail = identifier.includes("@");
  const phone = normalizePhone(identifier);
  const result = await getPool().query<{
    id: string;
    name: string;
    email: string;
    celular: string;
    password_hash: string;
    role: "client" | "admin";
    role_id: number;
  }>(
    `SELECT u.id, u.name, u.email, u.celular, u.password_hash, r.name AS role, u.role_id
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE (lower(u.email) = $1 AND $3 = TRUE) OR (u.celular = $2 AND $3 = FALSE)`,
    [normalizeEmail(identifier), phone, isEmail],
  );
  const account = result.rows[0];
  if (!account || !(await bcrypt.compare(password, account.password_hash))) {
    return jsonResponse({ error: "Email/celular ou senha inválidos." }, 401);
  }

  const client = await getPool().connect();
  try {
    const session = await createSession(client, account.id, rememberMe);
    return jsonResponse(
      { user: publicUser({ ...account, roleId: account.role_id }) },
      200,
      {
        "set-cookie": sessionCookie(request, session.token, session.ttlSeconds),
      },
    );
  } finally {
    client.release();
  }
}

async function handleAdmin(
  request: Request,
  user: AuthenticatedUser,
  pathname: string,
): Promise<Response> {
  if (user.role !== "admin")
    return jsonResponse({ error: "Acesso restrito a administradores." }, 403);
  if (pathname === "/api/admin/users" && request.method === "GET") {
    const users = await getPool().query(
      `SELECT u.id, u.name, u.email, u.celular, r.id AS role_id, r.name AS role, u.created_at, u.updated_at
         FROM users u JOIN roles r ON r.id = u.role_id ORDER BY u.created_at DESC`,
    );
    return jsonResponse({ users: users.rows });
  }

  const match = pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if (!match) return jsonResponse({ error: "Endpoint não encontrado." }, 404);
  const id = match[1]!;

  if (request.method === "GET") {
    const result = await getPool().query(
      `SELECT u.id, u.name, u.email, u.celular, r.id AS role_id, r.name AS role, u.created_at, u.updated_at
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [id],
    );
    return result.rowCount
      ? jsonResponse({ user: result.rows[0] })
      : jsonResponse({ error: "Usuário não encontrado." }, 404);
  }

  if (request.method === "PUT") {
    const body: unknown = await request.json().catch(() => ({}));
    const data = isJsonRecord(body) ? body : {};
    const name = String(data.name ?? "").trim();
    const email = normalizeEmail(String(data.email ?? ""));
    const celular = normalizePhone(String(data.celular ?? ""));
    const role = String(data.role ?? "");
    if (
      !name ||
      name.length > 120 ||
      invalidEmail(email) ||
      celular.length !== 11 ||
      !["client", "admin"].includes(role)
    ) {
      return jsonResponse(
        { error: "Dados de usuário ou role inválidos." },
        400,
      );
    }
    if (id === user.id && role !== user.role) {
      return jsonResponse(
        { error: "Não é permitido alterar o próprio papel administrativo." },
        400,
      );
    }
    try {
      const result = await getPool().query(
        `UPDATE users SET name = $1, email = $2, celular = $3,
           role_id = (SELECT id FROM roles WHERE name = $4), updated_at = NOW()
         WHERE id = $5 RETURNING id`,
        [name, email, celular, role, id],
      );
      return result.rowCount
        ? jsonResponse({ ok: true })
        : jsonResponse({ error: "Usuário não encontrado." }, 404);
    } catch (error) {
      if (isPgUniqueViolation(error))
        return jsonResponse({ error: "Email ou celular já está em uso." }, 409);
      throw error;
    }
  }

  if (request.method === "DELETE") {
    if (id === user.id)
      return jsonResponse(
        { error: "Não é permitido excluir a própria conta administrativa." },
        400,
      );
    const result = await getPool().query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id],
    );
    return result.rowCount
      ? jsonResponse({ ok: true })
      : jsonResponse({ error: "Usuário não encontrado." }, 404);
  }
  return jsonResponse({ error: "Método não permitido." }, 405);
}

export async function handleApi(request: Request): Promise<Response> {
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method.toUpperCase();

  try {
    if (pathname === "/api/health" && method === "GET") {
      return jsonResponse({ status: "ok" });
    }

    if (pathname === "/api/ready" && method === "GET") {
      await getPool().query("SELECT 1");
      return jsonResponse({ status: "ready", database: "ok" });
    }

    if (["POST", "PUT", "DELETE"].includes(method)) {
      const origin = request.headers.get("origin");
      const requestUrl = new URL(request.url);
      const forwardedProtocol = request.headers
        .get("x-forwarded-proto")
        ?.split(",")[0]
        ?.trim();
      const forwardedHost =
        request.headers.get("x-forwarded-host") ?? request.headers.get("host");
      const publicOrigin =
        process.env.RENDER === "true" && forwardedProtocol && forwardedHost
          ? `${forwardedProtocol}://${forwardedHost.split(",")[0]!.trim()}`
          : requestUrl.origin;
      if (origin) {
        let originMatches = false;
        try {
          originMatches = new URL(origin).origin === publicOrigin;
        } catch {
          originMatches = false;
        }
        if (!originMatches) {
          return jsonResponse(
            { error: "Origem da solicitação não permitida." },
            403,
          );
        }
      }
    }
    if (pathname === "/api/auth/register" && method === "POST")
      return await register(request);
    if (pathname === "/api/auth/login" && method === "POST")
      return await login(request);

    if (pathname === "/api/auth/check-phone" && method === "GET") {
      const celular = normalizePhone(searchParams.get("celular") ?? "");
      if (celular.length !== 11) return jsonResponse({ exists: false });
      const result = await getPool().query(
        "SELECT 1 FROM users WHERE celular = $1",
        [celular],
      );
      return jsonResponse({ exists: Boolean(result.rowCount) });
    }
    if (pathname === "/api/auth/check-email" && method === "GET") {
      const email = normalizeEmail(searchParams.get("email") ?? "");
      if (invalidEmail(email)) return jsonResponse({ exists: false });
      const result = await getPool().query(
        "SELECT 1 FROM users WHERE lower(email) = $1",
        [email],
      );
      return jsonResponse({ exists: Boolean(result.rowCount) });
    }

    if (pathname === "/api/auth/me" && method === "GET") {
      const user = await getAuthenticatedUser(request);
      if (!user)
        return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
      return jsonResponse({ user: publicUser(user) });
    }

    if (pathname === "/api/auth/logout" && method === "POST") {
      const token = getCookie(request, "riocard_session");
      if (token)
        await getPool().query("DELETE FROM sessions WHERE token_hash = $1", [
          hashToken(token),
        ]);
      return jsonResponse({ ok: true }, 200, {
        "set-cookie": clearSessionCookie(request),
      });
    }

    if (
      pathname === "/api/admin/users" ||
      pathname.startsWith("/api/admin/users/")
    ) {
      const user = await getAuthenticatedUser(request);
      if (!user)
        return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
      return await handleAdmin(request, user, pathname);
    }

    if (
      pathname === "/api/user-data" &&
      (method === "GET" || method === "POST")
    ) {
      const user = await getAuthenticatedUser(request);
      if (!user)
        return jsonResponse({ error: "Sessão inválida ou expirada." }, 401);
      if (method === "GET") {
        const result = await getPool().query<{ data: JsonRecord }>(
          "SELECT data FROM user_data WHERE user_id = $1",
          [user.id],
        );
        return jsonResponse({ data: result.rows[0]?.data ?? {} });
      }
      const body: unknown = await request.json().catch(() => ({}));
      const data =
        isJsonRecord(body) && isJsonRecord(body.data) ? body.data : null;
      if (!data)
        return jsonResponse({ error: "Dados do usuário inválidos." }, 400);
      await getPool().query(
        `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [user.id, JSON.stringify(data)],
      );
      return jsonResponse({ ok: true, data });
    }

    return jsonResponse({ error: "Endpoint não encontrado." }, 404);
  } catch (error) {
    if (isPgUniqueViolation(error))
      return jsonResponse({ error: "Email ou celular já cadastrado." }, 409);
    console.error("API request failed:", error);
    return jsonResponse(
      {
        error:
          "Falha no serviço. Verifique a conexão do banco e os logs do servidor.",
      },
      500,
    );
  }
}
