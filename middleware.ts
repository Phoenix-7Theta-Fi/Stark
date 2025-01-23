import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Protect practitioner routes
  if (request.nextUrl.pathname.startsWith("/practitioner")) {
    if (!token || token.role !== "practitioner") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  // Protect user routes
  if (request.nextUrl.pathname.startsWith("/user")) {
    // Allow admin access to user routes
    if (!token || (token.role !== "user" && token.role !== "admin")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/practitioner/:path*", "/user/:path*"]
}