import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ensureDatabaseReady } from "@/lib/init-db";
import { isMysqlConfigured } from "@/lib/db/pool";

export async function GET() {
  try {
    if (!isMysqlConfigured()) {
      return NextResponse.json({
        status: "needs_setup",
        service: "Suit Society",
        dbReady: false,
        message: "Configure MySQL in .env.local or complete /setup.",
      });
    }

    await ensureDatabaseReady();

    const db = createServiceClient();
    const { error } = await db.from("admin_users").select("id").limit(1);

    if (error) {
      const needsSchema =
        error.message.includes("admin_users") ||
        error.message.includes("does not exist") ||
        error.message.includes("doesn't exist");

      return NextResponse.json({
        status: needsSchema ? "needs_schema" : "error",
        service: "Suit Society",
        dbReady: false,
        message: needsSchema
          ? "Run mysql/schema.sql or log in to Admin to auto-initialize."
          : error.message,
      });
    }

    return NextResponse.json({
      status: "ok",
      service: "Suit Society",
      dbReady: true,
      storage: "mysql_media_files",
    });
  } catch {
    return NextResponse.json({
      status: "error",
      service: "Suit Society",
      dbReady: false,
      message: "Could not connect to MySQL.",
    });
  }
}
