import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: '/',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check for admin credentials
        if (credentials.email === process.env.ADMIN_EMAIL) {
          const isValidPassword = credentials.password === process.env.ADMIN_PASSWORD
          if (isValidPassword) {
            return {
              id: "admin",
              email: process.env.ADMIN_EMAIL,
              name: "Administrator",
              role: "admin"
            }
          }
          return null
        }

        // Regular user authentication
        const client = await clientPromise
        const users = client.db("tweb").collection("users")
        
        const user = await users.findOne({ email: credentials.email })
        
        if (!user) {
          return null
        }

        const passwordMatch = await compare(credentials.password, user.password)
        
        if (!passwordMatch) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.username,
          role: user.role as "user" | "practitioner",
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "user" | "practitioner" | "admin"
        session.user.email = token.email as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        const token = await (await fetch(`${baseUrl}/api/auth/session`)).json()
        const role = token?.user?.role as "user" | "practitioner" | "admin" | undefined
        
        if (role === "admin") {
          return `${baseUrl}/admin`
        }
        if (role === "practitioner") {
          return `${baseUrl}/practitioner`
        }
        return `${baseUrl}/user`
      }
      return url
    }
  }
}