import dotenv from "dotenv";
dotenv.config({ path: [".env.neon", ".env"] });
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import bcrypt from "bcryptjs";
import pg from "pg";

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
const sourceFile = resolve(".data/riocard-shared.json");

try {
  const source = JSON.parse(await readFile(sourceFile, "utf8"));
  const roleResult = await pool.query(
    "SELECT id FROM roles WHERE name = 'client'",
  );
  if (!roleResult.rowCount)
    throw new Error("Execute npm run db:init antes da importação.");
  let imported = 0;

  for (const account of Array.isArray(source.accounts) ? source.accounts : []) {
    const celular = String(account.celular ?? "").replace(/\D/g, "");
    const password = String(account.password ?? "");
    const name = String(account.firstName ?? "Usuário migrado")
      .trim()
      .slice(0, 120);
    if (celular.length !== 11 || !password) {
      console.warn(
        `Conta ${celular || "sem celular"} ignorada: dados inválidos ou senha ausente.`,
      );
      continue;
    }

    const email = `${celular}@legacy.invalid`;
    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const user = await client.query(
        `INSERT INTO users (name, email, celular, password_hash, role_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (celular) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`,
        [name, email, celular, passwordHash, roleResult.rows[0].id],
      );
      const legacyData = source.userData?.[celular] ?? {};
      if (
        legacyData &&
        typeof legacyData === "object" &&
        !Array.isArray(legacyData)
      ) {
        await client.query(
          `INSERT INTO user_data (user_id, data) VALUES ($1, $2::jsonb)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.rows[0].id, JSON.stringify(legacyData)],
        );
      }
      await client.query("COMMIT");
      imported++;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  console.log(
    `Migração concluída: ${imported} conta(s) processada(s). O arquivo de origem não foi alterado.`,
  );
  console.log(
    "Contas sem email receberam um identificador @legacy.invalid e podem continuar entrando com celular.",
  );
} catch (error) {
  console.error(
    "Não foi possível importar os dados antigos:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
