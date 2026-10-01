import dotenv from "dotenv";
dotenv.config({ path: [".env.neon", ".env"] });
import pg from "pg";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173";
const email = "teste@example.com";
let password = process.env.TEST_PASSWORD;
if (!password || password.length < 8) {
  console.error(
    "Defina TEST_PASSWORD com uma senha temporária de pelo menos 8 caracteres.",
  );
  process.exit(2);
}

const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST ?? "localhost",
      port: Number(process.env.DB_PORT ?? 5432),
      database: process.env.DB_NAME ?? "riocard",
      user: process.env.DB_USER ?? "riocard_user",
      password: process.env.DB_PASSWORD,
    });
const assert = (condition, name, detail = "") => {
  console.log(
    `${condition ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`,
  );
  if (!condition) process.exitCode = 1;
};
const cookieFrom = (response) =>
  (response.headers.getSetCookie?.() ?? [])
    .find((value) => value.startsWith("riocard_session="))
    ?.split(";")[0] ?? "";
const requestJson = async (
  path,
  { method = "GET", cookie = "", body } = {},
) => {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    headers.origin = baseUrl;
  }
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
};

let userId;
let adminTested = false;
const testCookies = [];
try {
  const exists = await pool.query(
    "SELECT id, name, celular FROM users WHERE lower(email) = $1",
    [email],
  );
  let clientCookie;
  let clientResponse;
  if (exists.rowCount) {
    const existing = exists.rows[0];
    if (
      existing.name !== "Teste Usuário" ||
      existing.celular !== "21987654321"
    ) {
      throw new Error(
        "teste@example.com já pertence a outra conta; não foi modificada.",
      );
    }
    userId = String(existing.id);
    const existingLogin = await requestJson("/api/auth/login", {
      method: "POST",
      body: { email, password, rememberMe: false },
    });
    clientResponse = existingLogin;
    clientCookie = cookieFrom(existingLogin);
    assert(
      existingLogin.status === 200,
      "login da conta de teste existente",
      `HTTP ${existingLogin.status}`,
    );
    if (existingLogin.status !== 200)
      throw new Error(
        "Senha de TEST_PASSWORD não confere com a conta de teste existente.",
      );
  } else {
    const registration = await requestJson("/api/auth/register", {
      method: "POST",
      body: {
        firstName: "Teste Usuário",
        email,
        celular: "21987654321",
        password,
        rememberMe: false,
      },
    });
    const registered = await registration.json();
    assert(
      registration.status === 201,
      "cadastro Teste Usuário",
      `HTTP ${registration.status}`,
    );
    if (registration.status !== 201)
      throw new Error(registered.error ?? "Cadastro falhou.");
    userId = String(registered.user.id);
    clientResponse = registration;
    clientCookie = cookieFrom(registration);
  }
  if (clientCookie) testCookies.push(clientCookie);
  assert(
    Boolean(clientCookie) &&
      clientResponse.headers.get("set-cookie")?.includes("HttpOnly"),
    "cookie de sessão HttpOnly",
  );

  const stored = await pool.query(
    `SELECT u.name, u.email, u.celular, u.password_hash, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
    [userId],
  );
  assert(
    stored.rows[0]?.email === email && stored.rows[0]?.name === "Teste Usuário",
    "usuário gravado no PostgreSQL",
  );
  assert(
    stored.rows[0]?.password_hash?.startsWith("$2") &&
      stored.rows[0]?.password_hash !== password,
    "senha armazenada como hash bcrypt",
  );
  assert(stored.rows[0]?.role === "client", "cadastro recebe role client");

  const duplicate = await requestJson("/api/auth/register", {
    method: "POST",
    body: {
      firstName: "Teste Usuário",
      email,
      celular: "21987654321",
      password,
      rememberMe: false,
    },
  });
  assert(
    duplicate.status === 409,
    "duplicidade de email/celular recusada",
    `HTTP ${duplicate.status}`,
  );

  const me = await requestJson("/api/auth/me", { cookie: clientCookie });
  const meBody = await me.json();
  assert(
    me.status === 200 && meBody.user?.role === "client",
    "sessão e role identificadas",
  );

  const validLogin = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email, password, rememberMe: false },
  });
  const loginCookie = cookieFrom(validLogin);
  if (loginCookie) testCookies.push(loginCookie);
  assert(
    validLogin.status === 200 && Boolean(loginCookie),
    "login com senha correta",
    `HTTP ${validLogin.status}`,
  );
  const validLoginMe = await requestJson("/api/auth/me", {
    cookie: loginCookie,
  });
  assert(validLoginMe.status === 200, "sessão de login válida");

  const novaSenha = `${password}Nova1!`;
  const passwordChange = await requestJson("/api/auth/change-password", {
    method: "POST",
    cookie: loginCookie,
    body: {
      currentPassword: password,
      newPassword: novaSenha,
      confirmPassword: novaSenha,
    },
  });
  assert(passwordChange.status === 200, "redeinição de senha aceita", `HTTP ${passwordChange.status}`);
  password = novaSenha;

  const loginComNovaSenha = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email, password: novaSenha, rememberMe: false },
  });
  assert(
    loginComNovaSenha.status === 200,
    "login com nova senha funciona",
    `HTTP ${loginComNovaSenha.status}`,
  );

  const wrongPassword = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email, password: `${password}-incorreta`, rememberMe: false },
  });
  assert(
    wrongPassword.status === 401,
    "senha incorreta recusada",
    `HTTP ${wrongPassword.status}`,
  );
  const missingEmail = await requestJson("/api/auth/login", {
    method: "POST",
    body: { email: "inexistente@example.com", password, rememberMe: false },
  });
  assert(
    missingEmail.status === 401,
    "email inexistente recusado",
    `HTTP ${missingEmail.status}`,
  );

  const privateRead = await requestJson("/api/user-data", {
    cookie: clientCookie,
  });
  assert(privateRead.status === 200, "client acessa somente seus dados");
  const data = {
    cards: [
      {
        id: "smoke-test-card",
        nome: "Cartão de teste",
        saldo: "42",
        tarifa: "4.70",
      },
    ],
    activeCardId: "smoke-test-card",
  };
  const privateWrite = await requestJson("/api/user-data", {
    method: "POST",
    cookie: clientCookie,
    body: { data },
  });
  assert(privateWrite.status === 200, "client grava os próprios dados");
  const persisted = await requestJson("/api/user-data", {
    cookie: clientCookie,
  });
  const persistedBody = await persisted.json();
  assert(
    persisted.status === 200 && persistedBody.data?.cards?.[0]?.saldo === "42",
    "dados recuperados do PostgreSQL",
  );

  const clientAdmin = await requestJson("/api/admin/users", {
    cookie: clientCookie,
  });
  assert(
    clientAdmin.status === 403,
    "client bloqueado na API administrativa",
    `HTTP ${clientAdmin.status}`,
  );

  const wrongOrigin = await fetch(`${baseUrl}/api/user-data`, {
    method: "POST",
    headers: {
      cookie: clientCookie,
      "content-type": "application/json",
      origin: "https://invalid.example",
    },
    body: JSON.stringify({ data }),
  });
  assert(
    wrongOrigin.status === 403,
    "origem externa recusada",
    `HTTP ${wrongOrigin.status}`,
  );

  await pool.query(
    "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = $1), updated_at = NOW() WHERE id = $2",
    ["admin", userId],
  );
  adminTested = true;
  const adminList = await requestJson("/api/admin/users", {
    cookie: clientCookie,
  });
  const adminBody = await adminList.json();
  assert(
    adminList.status === 200 &&
      adminBody.users?.some((row) => String(row.id) === userId),
    "admin consulta usuários",
    `HTTP ${adminList.status}`,
  );

  const selfDelete = await requestJson(`/api/admin/users/${userId}`, {
    method: "DELETE",
    cookie: clientCookie,
  });
  assert(
    selfDelete.status === 400,
    "admin não pode excluir a própria conta",
    `HTTP ${selfDelete.status}`,
  );
  await pool.query(
    "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = $1), updated_at = NOW() WHERE id = $2",
    ["client", userId],
  );
  adminTested = false;

  const sessionCount = await pool.query(
    "SELECT count(*)::int AS count FROM sessions WHERE user_id = $1",
    [userId],
  );
  assert(sessionCount.rows[0]?.count >= 2, "sessões persistidas no PostgreSQL");
} catch (error) {
  console.error(
    "Teste da API falhou:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  if (userId) {
    if (adminTested) {
      await pool
        .query(
          "UPDATE users SET role_id = (SELECT id FROM roles WHERE name = $1), updated_at = NOW() WHERE id = $2",
          ["client", userId],
        )
        .catch(() => undefined);
    }
    for (const cookie of testCookies) {
      await requestJson("/api/auth/logout", { method: "POST", cookie }).catch(
        () => undefined,
      );
    }
    const result = await pool
      .query("SELECT id, name, email, celular FROM users WHERE id = $1", [
        userId,
      ])
      .catch(() => ({ rows: [] }));
    if (result.rows[0]) {
      console.log(
        `Conta de teste mantida no banco como client: ${result.rows[0].name} (${result.rows[0].email}, ${result.rows[0].celular}); sessões de teste removidas.`,
      );
    }
  }
  await pool.end();
}
