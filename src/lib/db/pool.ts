import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

/** Call after changing MYSQL_* or DATABASE_URL in .env (e.g. during /setup). */
export function resetPool(): void {
  if (pool) {
    void pool.end();
    pool = null;
  }
}

export function isMysqlConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER)
  );
}

function useTls(host: string): boolean {
  if (process.env.MYSQL_SSL === "true") return true;
  return /tidbcloud\.com|tidb\.pingcap\.com/i.test(host);
}

function tlsOptions(): mysql.SslOptions {
  return { minVersion: "TLSv1.2", rejectUnauthorized: true };
}

function parseDatabaseUrl(url: string): mysql.PoolOptions {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const database = parsed.pathname.replace(/^\//, "").split("?")[0];
  const opts: mysql.PoolOptions = {
    host,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
  const sslParam = parsed.searchParams.get("sslaccept") || parsed.searchParams.get("ssl");
  if (sslParam || useTls(host)) {
    opts.ssl = tlsOptions();
  }
  return opts;
}

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const base: mysql.PoolOptions = {
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "Z",
    dateStrings: false,
  };

  if (process.env.DATABASE_URL) {
    pool = mysql.createPool({ ...base, ...parseDatabaseUrl(process.env.DATABASE_URL) });
  } else {
    const host = process.env.MYSQL_HOST || "127.0.0.1";
    pool = mysql.createPool({
      ...base,
      host,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "suitsociety",
      ...(useTls(host) ? { ssl: tlsOptions() } : {}),
    });
  }

  return pool;
}
