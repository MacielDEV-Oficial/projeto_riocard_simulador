import dotenv from "dotenv";
dotenv.config({ path: [".env.neon", ".env"] });
import pg from "pg";

const email = String(process.argv[2] ?? "")
  .trim()
  .toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Uso: npm run db:promote-admin -- usuario@exemplo.com");
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

try {
  const result = await pool.query(
    `UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin'), updated_at = NOW()
     WHERE lower(email) = $1 RETURNING email`,
    [email],
  );
  if (!result.rowCount) {
    console.error("Usuário não encontrado. Cadastre a conta primeiro.");
    process.exitCode = 1;
  } else {
    console.log(`${result.rows[0].email} agora tem role admin.`);
  }
} catch (error) {
  console.error(
    "Não foi possível alterar a role. Confira a conexão e execute npm run db:init.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
