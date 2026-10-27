import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const postgres = require("postgres");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const DB_PASSWORD = process.argv[2];
const REF = "khzhehimnnruushenboh";
const root = process.cwd();
const envPath = join(root, ".env.local");
const encoded = encodeURIComponent(DB_PASSWORD);

const URLS = [
  `postgresql://postgres:${encoded}@db.${REF}.supabase.co:5432/postgres`,
  `postgresql://postgres.${REF}:${encoded}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${REF}:${encoded}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${REF}:${encoded}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`,
];

function loadEnv() {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

function splitSql(schema) {
  const statements = [];
  let current = "";
  let inDollar = false;
  for (let i = 0; i < schema.length; i++) {
    if (schema.slice(i, i + 2) === "$$") { inDollar = !inDollar; current += "$$"; i++; continue; }
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

async function runSchema(url, schema) {
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 8, prepare: !url.includes(":6543") });
  try {
    for (const stmt of splitSql(schema)) {
      try { await sql.unsafe(stmt); } catch (e) { if (!ignorable(e.message)) throw e; }
    }
    await sql.end({ timeout: 3 });
    return true;
  } catch (e) {
    await sql.end({ timeout: 3 }).catch(() => undefined);
    throw e;
  }
}

async function main() {
  if (!DB_PASSWORD) { console.error("Password required"); process.exit(1); }
  loadEnv();

  let content = readFileSync(envPath, "utf8");
  if (content.includes("SUPABASE_DB_PASSWORD=")) {
    content = content.replace(/^SUPABASE_DB_PASSWORD=.*$/m, `SUPABASE_DB_PASSWORD=${DB_PASSWORD}`);
  } else {
    content += `\nSUPABASE_DB_PASSWORD=${DB_PASSWORD}\n`;
  }
  writeFileSync(envPath, content);

  const bootstrap = existsSync(join(root, "supabase", "bootstrap.sql"))
    ? readFileSync(join(root, "supabase", "bootstrap.sql"), "utf8") : "";
  const schema = readFileSync(join(root, "supabase", "schema.sql"), "utf8");

  let ok = false;
  let lastErr = "";
  for (const url of URLS) {
    try {
      console.log("Trying connection...");
      if (bootstrap) await runSchema(url, bootstrap);
      await runSchema(url, schema);
      ok = true;
      console.log("OK: schema applied");
      break;
    } catch (e) {
      lastErr = e.message;
      console.log("Fail:", e.message.slice(0, 80));
    }
  }
  if (!ok) { console.error("FAILED:", lastErr); process.exit(1); }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const hash = await bcrypt.hash("SuitXSociety@123897254", 12);
  const { data: existing } = await supabase.from("admin_users").select("id").limit(1);
  if (!existing?.length) {
    await supabase.from("admin_users").insert({ username: "SUiTsOcIety", password_hash: hash });
    console.log("OK: admin user created");
  } else {
    console.log("OK: admin exists");
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
      console.log("OK: bucket", bucket);
    } else {
      await supabase.storage.updateBucket(bucket, { public: true, fileSizeLimit: bucketLimits[bucket] });
    }
  }

  writeFileSync(join(root, ".setup-complete"), new Date().toISOString());
  console.log("DONE");
}

main();
