import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD;

if (!ref || !password) {
  console.log("No DB credentials in .env.local — apply supabase/migrations/004_homepage_heroes.sql manually in Supabase SQL editor.");
  process.exit(0);
}

const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
const sql = postgres(dbUrl, { ssl: "require", max: 1 });
const migration = readFileSync(resolve(root, "supabase/migrations/004_homepage_heroes.sql"), "utf8");

try {
  await sql.unsafe(migration);
  console.log("Migration 004 applied successfully");
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('homepage_heroes', 'hero_slides', 'banners')
  `;
  console.log("Tables:", tables.map((t) => t.table_name).join(", "));
} catch (err) {
  console.error("Migration error:", err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await sql.end();
}
