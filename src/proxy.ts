import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { hasDatabaseCredentials, isHostedDeployment } from "@/lib/runtime-env";

const PUBLIC_PATHS = ["/setup", "/api/setup", "/api/setup/init-db", "/api/health"];
const ADMIN_PUBLIC_PATHS = ["/admin/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cloudflare/Vercel inlines proxy env at build time, so dashboard secrets are often
  // invisible here even when they exist at runtime. Never trap production on /setup.
  const isSetup = hasDatabaseCredentials() || isHostedDeployment();

  if (!isSetup) {
    if (!PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/setup") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/checkout")) {
    const userSession = request.cookies.get("user_token");
    if (!userSession?.value) {
      const loginUrl = new URL("/account", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/admin") && !ADMIN_PUBLIC_PATHS.includes(pathname)) {
    const adminSession = request.cookies.get("ss_admin_session") ?? request.cookies.get("admin_token");
    if (!adminSession?.value) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/admin/upload|api/media|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
