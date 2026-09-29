import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

// The local source remains the existing .env. Neon is supplied transiently as
// NEON_DATABASE_URL so this migration never prints or persists a connection URI.
dotenv.config({ path: ".env" });

const targetUrl = process.env.NEON_DATABASE_URL;
if (!targetUrl) {
  console.error(
    "Defina NEON_DATABASE_URL temporariamente com a URL direta do Neon.",
  );
  process.exit(2);
}

const { Pool } = pg;
const localPool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "riocard",
  user: process.env.DB_USER ?? "riocard_user",
  password: process.env.DB_PASSWORD,
});
const neonPool = new Pool({
  connectionString: targetUrl,
  ssl: { rejectUnauthorized: true },
});

try {
  const [
    schema,
    seed,
    sourceRoles,
    sourceUsers,
    sourceData,
    sourceSessionCount,
  ] = await Promise.all([
    readFile(resolve("database/schema.sql"), "utf8"),
    readFile(resolve("database/seed.sql"), "utf8"),
    localPool.query("SELECT id, name FROM roles ORDER BY id"),
    localPool.query(
      "SELECT id, name, email, celular, password_hash, role_id, created_at, updated_at FROM users ORDER BY id",
    ),
    localPool.query(
      "SELECT user_id, data, updated_at FROM user_data ORDER BY user_id",
    ),
    localPool.query("SELECT count(*)::int AS count FROM sessions"),
  ]);
  const roleNameById = new Map(
    sourceRoles.rows.map((role) => [String(role.id), role.name]),
  );
  const dataByUserId = new Map(
    sourceData.rows.map((row) => [String(row.user_id), row]),
  );
  const unknownRoles = sourceUsers.rows
    .map((user) => roleNameById.get(String(user.role_id)))
    .filter((role) => role !== "client" && role !== "admin");
  if (unknownRoles.length)
    throw new Error(
      "Há usuários com roles não reconhecidas; a migração foi cancelada sem gravar no Neon.",
    );

  const client = await neonPool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT to_regclass('public.users') AS users_table, to_regclass('public.user_data') AS data_table",
    );
    const existingUsers = existing.rows[0].users_table
      ? Number((await client.query("SELECT count(*) FROM users")).rows[0].count)
      : 0;
    const existingUserData = existing.rows[0].data_table
      ? Number(
          (await client.query("SELECT count(*) FROM user_data")).rows[0].count,
        )
      : 0;
    if (existingUsers > 0 || existingUserData > 0) {
      throw new Error(
        "O branch Neon já contém usuários ou dados do planejador; por segurança, não sobrescrevi nem mesclei registros.",
      );
    }

    await client.query(schema);
    await client.query(seed);
    const targetRoles = await client.query(
      "SELECT id, name FROM roles WHERE name = ANY($1)",
      [["client", "admin"]],
    );
    const targetRoleIdByName = new Map(
      targetRoles.rows.map((role) => [role.name, role.id]),
    );

    for (const user of sourceUsers.rows) {
      const roleName = roleNameById.get(String(user.role_id));
      const targetRoleId = targetRoleIdByName.get(roleName);
      if (!targetRoleId)
        throw new Error(
          `Role de destino ausente: ${roleName ?? "desconhecida"}.`,
        );
      await client.query(
        `INSERT INTO users (id, name, email, celular, password_hash, role_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          user.name,
          user.email,
          user.celular,
          user.password_hash,
          targetRoleId,
          user.created_at,
          user.updated_at,
        ],
      );

      const saved = dataByUserId.get(String(user.id));
      if (saved) {
        await client.query(
          `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3)`,
          [user.id, JSON.stringify(saved.data), saved.updated_at],
        );
      }
    }

    await client.query(
      `SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(COALESCE((SELECT max(id) FROM users), 1), 1), EXISTS (SELECT 1 FROM users))`,
    );
    await client.query("COMMIT");
    console.log(
      `Migração concluída: ${sourceUsers.rowCount} usuário(s), ${sourceData.rowCount} registro(s) do planejador e ${targetRoles.rowCount} role(s) no Neon.`,
    );
    console.log(
      `Sessões locais ativas não foram migradas: ${sourceSessionCount.rows[0].count}. Faça novo login no app após a troca.`,
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
} catch (error) {
  console.error(
    "Migração local → Neon não concluída:",
    error instanceof Error ? error.message : "erro desconhecido",
  );
  process.exitCode = 1;
} finally {
  await Promise.all([localPool.end(), neonPool.end()]);
}
