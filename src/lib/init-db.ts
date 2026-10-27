import { readFileSync, existsSync } from "fs";
import { join } from "path";
import mysql from "mysql2/promise";
import { getPool, isMysqlConfigured, resetPool } from "@/lib/db/pool";

export function applyMysqlEnv(config: {
  mysqlHost?: string;
  mysqlPort?: string;
  mysqlUser?: string;
  mysqlPassword?: string;
  mysqlDatabase?: string;
  databaseUrl?: string;
}): void {
  if (config.databaseUrl) {
    process.env.DATABASE_URL = config.databaseUrl;
    delete process.env.MYSQL_HOST;
    delete process.env.MYSQL_DATABASE;
  } else {
    delete process.env.DATABASE_URL;
    if (config.mysqlHost) process.env.MYSQL_HOST = config.mysqlHost;
    if (config.mysqlPort) process.env.MYSQL_PORT = config.mysqlPort;
    if (config.mysqlUser) process.env.MYSQL_USER = config.mysqlUser;
    process.env.MYSQL_PASSWORD = config.mysqlPassword ?? "";
    if (config.mysqlDatabase) process.env.MYSQL_DATABASE = config.mysqlDatabase;
  }
  resetPool();
}

export async function ensureMysqlDatabaseExists(): Promise<{ success: boolean; error?: string }> {
  if (!isMysqlConfigured()) {
    return { success: false, error: "MySQL not configured." };
  }

  const dbName = process.env.MYSQL_DATABASE || "suitsociety";

  try {
    if (process.env.DATABASE_URL) {
      const parsed = new URL(process.env.DATABASE_URL);
      const name = parsed.pathname.replace(/^\//, "") || dbName;
      parsed.pathname = "/";
      const conn = await mysql.createConnection({
        uri: parsed.toString(),
      });
      await conn.query(
        `CREATE DATABASE IF NOT EXISTS \`${name.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      await conn.end();
      return { success: true };
    }

    const host = process.env.MYSQL_HOST || "127.0.0.1";
    const tls =
      process.env.MYSQL_SSL === "true" || /tidbcloud\.com|tidb\.pingcap\.com/i.test(host)
        ? { minVersion: "TLSv1.2" as const, rejectUnauthorized: true }
        : undefined;
    const conn = await mysql.createConnection({
      host,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      ...(tls ? { ssl: tls } : {}),
    });
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.end();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("access denied")) {
      return {
        success: false,
        error:
          "MySQL login failed. Check MySQL user and password (root often needs the password you set during MySQL install).",
      };
    }
    if (message.toLowerCase().includes("econnrefused")) {
      return {
        success: false,
        error: "Cannot reach MySQL on this host/port. Start MySQL (XAMPP/WAMP/services.msc) and use 127.0.0.1:3306.",
      };
    }
    return { success: false, error: message };
  }
}

function splitSqlStatements(schema: string): string[] {
  const statements: string[] = [];
  let current = "";
  for (let i = 0; i < schema.length; i++) {
    if (schema[i] === ";") {
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

function isIgnorableSqlError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already exists") || lower.includes("duplicate");
}

export async function initializeDatabase(): Promise<{ success: boolean; error?: string }> {
  if (!isMysqlConfigured()) {
    return {
      success: false,
      error: "MySQL not configured. Set DATABASE_URL or MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE in .env.local.",
    };
  }

  const schemaPath = join(process.cwd(), "mysql", "schema.sql");
  if (!existsSync(schemaPath)) {
    return { success: false, error: "mysql/schema.sql not found." };
  }

  const created = await ensureMysqlDatabaseExists();
  if (!created.success) return created;

  const schema = readFileSync(schemaPath, "utf8");
  const pool = getPool();

  try {
    for (const statement of splitSqlStatements(schema)) {
      try {
        await pool.execute(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isIgnorableSqlError(message)) throw error;
      }
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database initialization failed",
    };
  }
}

export async function runMigrations(): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function ensureOtpSessionsTable(): Promise<{ ready: boolean; error?: string }> {
  const init = await initializeDatabase();
  return { ready: init.success, error: init.error };
}

let autoInitPromise: Promise<{ dbReady: boolean; message?: string }> | null = null;

export async function ensureDatabaseReady(): Promise<{ dbReady: boolean; message?: string }> {
  if (!isMysqlConfigured()) {
    return {
      dbReady: false,
      message: "Set DATABASE_URL or MYSQL_* variables in .env.local.",
    };
  }

  if (autoInitPromise) return autoInitPromise;

  autoInitPromise = (async () => {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const db = createServiceClient();

    const { error } = await db.from("admin_users").select("id").limit(1);
    if (!error) return { dbReady: true };

    const needsSchema =
      error.message.includes("admin_users") ||
      error.message.includes("doesn't exist") ||
      error.message.includes("does not exist") ||
      error.message.includes("Unknown table");

    if (!needsSchema) {
      return { dbReady: false, message: error.message };
    }

    const result = await initializeDatabase();
    if (!result.success) {
      return { dbReady: false, message: result.error };
    }

    try {
      const { initializeDefaultAdmin } = await import("@/lib/auth");
      await initializeDefaultAdmin();
    } catch {
      /* non-fatal */
    }

    const { error: recheck } = await db.from("admin_users").select("id").limit(1);
    if (recheck) {
      return { dbReady: false, message: recheck.message };
    }

    return { dbReady: true };
  })();

  try {
    return await autoInitPromise;
  } finally {
    autoInitPromise = null;
  }
}
