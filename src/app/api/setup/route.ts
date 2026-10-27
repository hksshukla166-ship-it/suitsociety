import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { applyMysqlEnv, initializeDatabase } from "@/lib/init-db";

function mergeEnvFile(updates: Record<string, string>): void {
  const envPath = join(process.cwd(), ".env.local");
  const lines: string[] = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
  const map = new Map<string, string>();

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    map.set(line.slice(0, eq), line.slice(eq + 1));
  }

  for (const [key, value] of Object.entries(updates)) {
    map.set(key, value);
  }

  const merged = [...map.entries()].map(([k, v]) => `${k}=${v}`).join("\n");
  writeFileSync(envPath, `${merged}\n`, "utf8");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mysqlHost,
      mysqlPort,
      mysqlUser,
      mysqlPassword,
      mysqlDatabase,
      databaseUrl,
      razorpayKeyId,
      razorpayKeySecret,
      siteUrl,
      initSchema,
    } = body;

    const hasUrl = Boolean(databaseUrl);
    const hasParts = Boolean(mysqlHost && mysqlUser && mysqlDatabase);

    if (!hasUrl && !hasParts) {
      return NextResponse.json(
        { error: "Provide DATABASE_URL or MySQL host, user, and database name." },
        { status: 400 }
      );
    }

    const envUpdates: Record<string, string> = {
      NEXT_PUBLIC_SITE_URL: siteUrl || "http://localhost:3000",
    };

    if (hasUrl) {
      envUpdates.DATABASE_URL = String(databaseUrl);
    } else {
      envUpdates.MYSQL_HOST = String(mysqlHost);
      envUpdates.MYSQL_PORT = String(mysqlPort || "3306");
      envUpdates.MYSQL_USER = String(mysqlUser);
      envUpdates.MYSQL_PASSWORD = String(mysqlPassword ?? "");
      envUpdates.MYSQL_DATABASE = String(mysqlDatabase);
    }

    if (razorpayKeyId) {
      envUpdates.RAZORPAY_KEY_ID = String(razorpayKeyId);
      envUpdates.NEXT_PUBLIC_RAZORPAY_KEY_ID = String(razorpayKeyId);
    }
    if (razorpayKeySecret) envUpdates.RAZORPAY_KEY_SECRET = String(razorpayKeySecret);

    mergeEnvFile(envUpdates);
    writeFileSync(join(process.cwd(), ".setup-complete"), new Date().toISOString());

    applyMysqlEnv({
      databaseUrl: hasUrl ? String(databaseUrl) : undefined,
      mysqlHost: hasUrl ? undefined : String(mysqlHost),
      mysqlPort: hasUrl ? undefined : String(mysqlPort || "3306"),
      mysqlUser: hasUrl ? undefined : String(mysqlUser),
      mysqlPassword: hasUrl ? undefined : String(mysqlPassword ?? ""),
      mysqlDatabase: hasUrl ? undefined : String(mysqlDatabase),
    });

    let dbInitialized = false;
    let initError: string | undefined;

    if (initSchema !== false) {
      const initResult = await initializeDatabase();
      if (initResult.success) {
        dbInitialized = true;
        try {
          const { initializeDefaultAdmin } = await import("@/lib/auth");
          await initializeDefaultAdmin();
        } catch {
          /* non-fatal */
        }
      } else {
        initError = initResult.error;
      }
    }

    if (initError) {
      return NextResponse.json(
        {
          success: false,
          dbInitialized: false,
          error: initError,
          message: initError,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      dbInitialized,
      message: dbInitialized
        ? "Setup complete. Restart the dev server, then open the store."
        : "Settings saved. Restart the dev server.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Setup failed" },
      { status: 500 }
    );
  }
}
