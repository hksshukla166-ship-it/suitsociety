import { readFileSync } from "fs";
import postgres from "postgres";

function loadEnv() {
  const content = readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

loadEnv();

const ref = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
const pwd = process.env.SUPABASE_DB_PASSWORD;
const enc = encodeURIComponent(pwd);

const regions = [
  "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  "us-east-1", "us-west-1", "eu-west-1", "eu-west-2", "eu-central-1",
];

const urls = [
  process.env.SUPABASE_DB_URL,
  `postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`,
];

for (const region of regions) {
  for (const prefix of ["aws-0", "aws-1"]) {
    urls.push(`postgresql://postgres.${ref}:${enc}@${prefix}-${region}.pooler.supabase.com:6543/postgres`);
    urls.push(`postgresql://postgres.${ref}:${enc}@${prefix}-${region}.pooler.supabase.com:5432/postgres`);
  }
}

for (const u of urls.filter(Boolean)) {
  const label = u.replace(/:([^:@/]+)@/, ":***@");
  try {
    const sql = postgres(u, { ssl: "require", max: 1, connect_timeout: 8, prepare: !u.includes(":6543") });
    const r = await sql`select 1 as ok`;
    await sql.end({ timeout: 3 });
    console.log("OK:", label);
    console.log("Result:", r);
    process.exit(0);
  } catch (e) {
    console.log("FAIL:", label.slice(0, 80), "->", String(e.message || e).slice(0, 100));
  }
}

process.exit(1);
