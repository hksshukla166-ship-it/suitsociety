import { NextRequest, NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";

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

    const lines: string[] = [];
    if (hasUrl) {
      lines.push(`DATABASE_URL=${databaseUrl}`);
    } else {
      lines.push(`MYSQL_HOST=${mysqlHost}`);
      lines.push(`MYSQL_PORT=${mysqlPort || "3306"}`);
      lines.push(`MYSQL_USER=${mysqlUser}`);
      lines.push(`MYSQL_PASSWORD=${mysqlPassword || ""}`);
      lines.push(`MYSQL_DATABASE=${mysqlDatabase}`);
    }
    if (razorpayKeyId) lines.push(`RAZORPAY_KEY_ID=${razorpayKeyId}`);
    if (razorpayKeySecret) lines.push(`RAZORPAY_KEY_SECRET=${razorpayKeySecret}`);
    if (razorpayKeyId) lines.push(`NEXT_PUBLIC_RAZORPAY_KEY_ID=${razorpayKeyId}`);
    lines.push(`NEXT_PUBLIC_SITE_URL=${siteUrl || "http://localhost:3000"}`);

    writeFileSync(join(process.cwd(), ".env.local"), `${lines.join("\n")}\n`);
    writeFileSync(join(process.cwd(), ".setup-complete"), new Date().toISOString());

    let dbInitialized = false;
    if (initSchema !== false) {
      try {
        const { initializeDatabase } = await import("@/lib/init-db");
        const { initializeDefaultAdmin } = await import("@/lib/auth");
        const initResult = await initializeDatabase();
        if (initResult.success) {
          dbInitialized = true;
          try {
            await initializeDefaultAdmin();
          } catch {
            /* non-fatal */
          }
        }
      } catch {
        /* schema can be run from admin login */
      }
    }

    return NextResponse.json({
      success: true,
      dbInitialized,
      message: dbInitialized
        ? "Setup complete. MySQL database initialized!"
        : "Setup complete. Initialize the database from Admin login if needed.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Setup failed" },
      { status: 500 }
    );
  }
}
