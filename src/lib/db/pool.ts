import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function isMysqlConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.MYSQL_HOST && process.env.MYSQL_DATABASE && process.env.MYSQL_USER)
  );
}

function parseDatabaseUrl(url: string): mysql.PoolOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  };
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
    pool = mysql.createPool({
      ...base,
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE || "suitsociety",
    });
  }

  return pool;
}
