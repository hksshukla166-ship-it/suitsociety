import { NextResponse } from "next/server";
import { initializeDatabase, runMigrations } from "@/lib/init-db";
import { initializeDefaultAdmin } from "@/lib/auth";

export async function POST() {
  try {
    const result = await initializeDatabase();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const migrations = await runMigrations();
    if (!migrations.success) {
      return NextResponse.json({
        success: true,
        message: migrations.error || "Database initialized with warnings.",
      });
    }

    try {
      await initializeDefaultAdmin();
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      success: true,
      message: "MySQL database initialized. You can log in now.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Initialization failed" },
      { status: 500 }
    );
  }
}
