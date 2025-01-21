// lib/auth.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { Db } from "mongodb";
import clientPromise from "./db";

interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
}

async function getUserByEmail(email: string) {
  const client = await clientPromise;
  const db = client.db('tangerine') as Db;
  return db.collection<User>('users').findOne({ email });
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role || "user"
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role || "user";
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    error: "/auth/error"
  }
};

export const { 
  handlers,
  auth,
  signIn,
  signOut
} = NextAuth(authOptions);