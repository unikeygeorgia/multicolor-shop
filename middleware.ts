import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based routing:
 *  - admin.<domain>  → every page serves the admin panel (/admin)
 *  - main domain     → /admin is blocked (admin lives only on the subdomain)
 *  - localhost       → /admin allowed directly for development
 * /api and static assets are excluded via the matcher below.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const { pathname } = req.nextUrl;
  const isLocal = host.includes("localhost") || host.startsWith("127.");
  const isAdminHost = host.startsWith("admin.");

  if (isAdminHost) {
    if (pathname === "/admin") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/admin") && !isLocal) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|fonts/|.*\\..*).*)"],
};
