import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env.local");
  process.exit(1);
}

const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
const sql = postgres(dbUrl, { ssl: "require", max: 1 });

const migrationsDir = join(root, "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  for (const file of files) {
    const migration = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await sql.unsafe(migration);
    console.log(`OK: ${file}`);
  }

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products'
      AND column_name IN ('cost_price', 'discount_percent', 'size_stock')
    ORDER BY column_name
  `;
  console.log("Verified columns:", cols.map((c) => c.column_name).join(", "));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.toLowerCase().includes("already exists")) {
    console.log("Some objects already exist — migration may have been partially applied.");
  } else {
    console.error("Migration error:", msg);
    process.exit(1);
  }
} finally {
  await sql.end();
}
