import dotenv from "dotenv";
dotenv.config({ path: [".env.neon", ".env"] });
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
  const result = await pool.query(`
    SELECT current_database() AS database, current_user AS db_user,
           (SELECT count(*) FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name IN ('roles', 'users', 'sessions', 'user_data')) AS tables,
           (SELECT string_agg(name, ', ' ORDER BY name) FROM roles) AS roles
  `);
  console.log(result.rows[0]);
} catch (error) {
  console.error(
    "Falha ao consultar PostgreSQL:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
