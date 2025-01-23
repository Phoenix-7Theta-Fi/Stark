import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "user" | "practitioner" | "admin"
      email: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: "user" | "practitioner" | "admin"
    email: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "user" | "practitioner" | "admin"
    email: string
  }
}