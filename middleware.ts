import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Ensure authenticated users can't access the login page
    if (path === "/" && token) {
      return NextResponse.redirect(
        new URL(
          token.role === "practitioner" ? "/practitioner" : "/user",
          req.url
        )
      )
    }

    // Protect dashboard routes and ensure role-based access
    if (path.startsWith("/user") && token?.role !== "user") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    if (path.startsWith("/practitioner") && token?.role !== "practitioner") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// Specify which routes to protect
export const config = {
  matcher: ["/user/:path*", "/practitioner/:path*"],
}