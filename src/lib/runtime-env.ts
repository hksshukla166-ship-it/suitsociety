export function readEnv(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function hasDatabaseCredentials(): boolean {
  if (readEnv("DATABASE_URL")) return true;
  return Boolean(readEnv("MYSQL_HOST") && readEnv("MYSQL_DATABASE") && readEnv("MYSQL_USER"));
}

/** Local /setup writes .env.local — that cannot work on Cloudflare/Vercel/Netlify. */
export function isHostedDeployment(): boolean {
  return (
    readEnv("NODE_ENV") === "production" ||
    readEnv("CF_PAGES") === "1" ||
    Boolean(readEnv("CF_PAGES_COMMIT_SHA")) ||
    Boolean(readEnv("CLOUDFLARE_ENV")) ||
    Boolean(readEnv("VERCEL")) ||
    Boolean(readEnv("NETLIFY"))
  );
}
