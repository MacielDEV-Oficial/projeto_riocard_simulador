import dotenv from "dotenv";
dotenv.config({ path: [".env.neon", ".env"] });
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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

try {
  await pool.query("SELECT 1");
  const schema = await readFile(resolve("database/schema.sql"), "utf8");
  const seed = await readFile(resolve("database/seed.sql"), "utf8");
  await pool.query(schema);
  await pool.query(seed);
  const result = await pool.query("SELECT name FROM roles ORDER BY name");
  console.log(
    `Schema pronto no banco ${process.env.DB_NAME ?? "riocard"}. Roles: ${result.rows.map((row) => row.name).join(", ")}.`,
  );
} catch (error) {
  console.error(
    "Não foi possível inicializar PostgreSQL. Confira serviço, banco, usuário e .env.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
