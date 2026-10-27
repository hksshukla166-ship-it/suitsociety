import postgres from "postgres";

const password = "+R!C8!vnSr+4Fs&";
const ref = "khzhehimnnruushenboh";
const encoded = encodeURIComponent(password);

const urls = [
  `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${encoded}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${encoded}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${encoded}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`,
];

for (const url of urls) {
  const masked = url.replace(encoded, "***");
  console.log("\nTesting:", masked);
  const sql = postgres(url, { ssl: "require", max: 1, connect_timeout: 20, prepare: !url.includes(":6543") });
  try {
    const result = await sql`select 1 as ok`;
    console.log("SUCCESS:", result);
    await sql.end({ timeout: 5 });
    process.exit(0);
  } catch (e) {
    console.log("FAIL:", e?.message || e?.code || String(e));
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }
}
process.exit(1);
