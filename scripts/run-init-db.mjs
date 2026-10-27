import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
const dbPassword = process.argv[2];

if (!dbPassword) {
  console.error("Usage: node scripts/run-init-db.mjs <db-password>");
  process.exit(1);
}

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const idx = line.indexOf("=");
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

function persistPassword(password) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `SUPABASE_DB_PASSWORD=${password}`;
  content = content.includes("SUPABASE_DB_PASSWORD=")
    ? content.replace(/^SUPABASE_DB_PASSWORD=.*$/m, line)
    : content.trimEnd() + (content.endsWith("\n") ? "" : "\n") + line + "\n";
  writeFileSync(envPath, content, "utf8");
}

function getProjectRef(url) {
  return url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

function buildUrls(ref, password) {
  const encoded = encodeURIComponent(password);
  const regions = ["ap-south-1", "ap-southeast-1", "us-east-1", "eu-west-1", "eu-central-1"];
  const prefixes = ["aws-0", "aws-1"];
  const urls = [];
  for (const prefix of prefixes) {
    for (const region of regions) {
      urls.push(`postgresql://postgres.${ref}:${encoded}@${prefix}-${region}.pooler.supabase.com:5432/postgres`);
      urls.push(`postgresql://postgres.${ref}:${encoded}@${prefix}-${region}.pooler.supabase.com:6543/postgres`);
    }
  }
  urls.push(`postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`);
  return [...new Set(urls)];
}

function splitStatements(schema) {
  const statements = [];
  let current = "";
  let inDollar = false;
  for (let i = 0; i < schema.length; i++) {
    if (schema.slice(i, i + 2) === "$$") {
      inDollar = !inDollar;
      current += "$$";
      i++;
      continue;
    }
    if (schema[i] === ";" && !inDollar) {
      const trimmed = current.trim();
      if (trimmed && !trimmed.startsWith("--")) statements.push(trimmed);
      current = "";
      continue;
    }
    current += schema[i];
  }
  const last = current.trim();
  if (last && !last.startsWith("--")) statements.push(last);
  return statements;
}

function ignorable(msg) {
  const lower = msg.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate key") ||
    lower.includes("duplicate_object") ||
    (lower.includes("policy") && lower.includes("already"))
  );
}

async function runSchema(sql, schema) {
  for (const statement of splitStatements(schema)) {
    try {
      await sql.unsafe(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!ignorable(message)) throw error;
    }
  }
}

async function tryInit(url, schema, bootstrap) {
  const sql = postgres(url, {
    ssl: "require",
    max: 1,
    connect_timeout: 30,
    prepare: !url.includes(":6543"),
  });
  try {
    if (bootstrap) await runSchema(sql, bootstrap);
    await runSchema(sql, schema);
    await sql.end({ timeout: 5 });
    return { ok: true };
  } catch (error) {
    await sql.end({ timeout: 5 }).catch(() => undefined);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const env = loadEnv();
persistPassword(dbPassword);
const ref = getProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
if (!ref) {
  console.error("NEXT_PUBLIC_SUPABASE_URL missing in .env.local");
  process.exit(1);
}

const bootstrapPath = join(root, "supabase", "bootstrap.sql");
const schemaPath = join(root, "supabase", "schema.sql");
const bootstrap = existsSync(bootstrapPath) ? readFileSync(bootstrapPath, "utf8") : "";
const schema = readFileSync(schemaPath, "utf8");
const urls = buildUrls(ref, dbPassword);

let lastError = "Could not connect to database";
for (const url of urls) {
  process.stdout.write(`Trying ${url.replace(dbPassword, "***")} ... `);
  const result = await tryInit(url, schema, bootstrap);
  if (result.ok) {
    console.log("OK");
    console.log("Database initialized successfully.");
    process.exit(0);
  }
  console.log("failed");
  lastError = result.error || lastError;
}

console.error("Init failed:", lastError);
process.exit(1);
