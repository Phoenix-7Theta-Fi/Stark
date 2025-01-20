import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: "user" | "practitioner"
    } & DefaultSession["user"]
  }

  interface User {
    role: "user" | "practitioner"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "practitioner"
  }
}