import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BLOCKED_PREFIXES = [
  "/planner/todos",
  "/documents",
  "/finance",
  "/finance/jobs",
  "/estimates",
  "/inventory",
  "/api/todos",
  "/api/estimates",
  "/api/finance",
  "/api/inventory",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/planner/:path*",
    "/documents/:path*",
    "/finance/:path*",
    "/estimates/:path*",
    "/inventory/:path*",
    "/api/todos/:path*",
    "/api/estimates/:path*",
    "/api/finance/:path*",
    "/api/inventory/:path*",
  ],
};

