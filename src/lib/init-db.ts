import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getPool, isMysqlConfigured } from "@/lib/db/pool";

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
