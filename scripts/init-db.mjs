import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const postgres = require("postgres");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const DB_PASSWORD = process.argv[2];
if (!DB_PASSWORD) {
  console.error("Usage: node scripts/init-db.mjs <db-password>");
  process.exit(1);
}

const root = process.cwd();
const envPath = join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

function persistDbPassword(password) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `SUPABASE_DB_PASSWORD=${password}`;
  if (content.includes("SUPABASE_DB_PASSWORD=")) {
    content = content.replace(/^SUPABASE_DB_PASSWORD=.*$/m, line);
  } else {
    content = content.trimEnd() + (content.endsWith("\n") ? "" : "\n") + line + "\n";
  }
  writeFileSync(envPath, content, "utf8");
}

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function buildUrls(password) {
  const ref = getProjectRef();
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

function splitSql(schema) {
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
      const t = current.trim();
      if (t && !t.startsWith("--")) statements.push(t);
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
  const l = msg.toLowerCase();
  return l.includes("already exists") || l.includes("duplicate") || (l.includes("policy") && l.includes("already"));
}

async function runSchema(connectionString, schema) {
  const sql = postgres(connectionString, {
    ssl: "require",
    max: 1,
    connect_timeout: 30,
    prepare: !connectionString.includes(":6543"),
  });
  try {
    for (const stmt of splitSql(schema)) {
      try {
        await sql.unsafe(stmt);
      } catch (e) {
        if (!ignorable(e.message)) throw e;
      }
    }
    await sql.end({ timeout: 5 });
    return true;
  } catch (e) {
    await sql.end({ timeout: 5 }).catch(() => undefined);
    throw e;
  }
}

async function main() {
  loadEnv();
  persistDbPassword(DB_PASSWORD);

  const bootstrapPath = join(root, "supabase", "bootstrap.sql");
  const schemaPath = join(root, "supabase", "schema.sql");
  const bootstrap = existsSync(bootstrapPath) ? readFileSync(bootstrapPath, "utf8") : "";
  const schema = readFileSync(schemaPath, "utf8");

  let connected = false;
  let lastError = "Could not connect";

  for (const url of buildUrls(DB_PASSWORD)) {
    try {
      if (bootstrap) await runSchema(url, bootstrap);
      await runSchema(url, schema);
      connected = true;
      console.log("✓ Database schema initialized");
      break;
    } catch (e) {
      lastError = e.message;
    }
  }

  if (!connected) {
    console.error("✗ DB init failed:", lastError);
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const hash = await bcrypt.hash("SuitXSociety@123897254", 12);
  const { data: existing } = await supabase.from("admin_users").select("id").limit(1);
  if (!existing?.length) {
    await supabase.from("admin_users").insert({ username: "SUiTsOcIety", password_hash: hash });
    console.log("✓ Admin user created");
  } else {
    console.log("✓ Admin user already exists");
  }

  const MAX_VIDEO_SIZE_BYTES = 11 * 1024 * 1024;
  const bucketLimits = {
    products: 52428800,
    banners: 52428800,
    images: 52428800,
    videos: MAX_VIDEO_SIZE_BYTES,
  };

  for (const bucket of ["products", "banners", "images", "videos"]) {
    const { data } = await supabase.storage.getBucket(bucket);
    if (!data) {
      await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: bucketLimits[bucket] });
      console.log(`✓ Bucket created: ${bucket}`);
    } else {
      await supabase.storage.updateBucket(bucket, { public: true, fileSizeLimit: bucketLimits[bucket] });
      console.log(`✓ Bucket updated: ${bucket}`);
    }
  }

  writeFileSync(join(root, ".setup-complete"), new Date().toISOString());
  console.log("✓ Setup complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
