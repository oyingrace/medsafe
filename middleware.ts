import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "ms_session";

// Routes that are always public (no login required)
const PUBLIC_PATHS = ["/login", "/api/", "/"];

// Routes that require auth (the manufacturer dashboard)
const PROTECTED_PREFIXES = ["/dashboard"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow exact root path (landing page)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow other public paths
  if (PUBLIC_PATHS.some((p) => p !== "/" && pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
