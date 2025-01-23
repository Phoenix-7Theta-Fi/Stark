"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { UserInput } from "@/lib/auth"

type AuthMode = "login" | "register"

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const username = formData.get("username") as string
    const role = formData.get("role") as "user" | "practitioner"

    try {
      if (mode === "register") {
        const userData: UserInput = {
          email,
          password,
          username,
          role
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Registration failed")
        }
        
        // After successful registration, log the user in
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("Login failed after registration")
        }

        if (role === "practitioner") {
          router.push("/practitioner")
        } else {
          router.push("/user")
        }
      } else {
        // Handle login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error("Invalid credentials")
        }

        // Get session to check role
        const session = await fetch("/api/auth/session").then(res => res.json())
        const userRole = session?.user?.role

        // Redirect based on role
        if (userRole === "admin") {
          router.push("/admin")
        } else if (userRole === "practitioner") {
          router.push("/practitioner")
        } else {
          router.push("/user")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-8">
        <h2 className="text-2xl font-semibold">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full p-2 border rounded-md"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full p-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full p-2 border rounded-md"
          />
        </div>

        {mode === "register" && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-1">
              Account Type
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full p-2 border rounded-md"
            >
              <option value="user">Regular User</option>
              <option value="practitioner">Practitioner</option>
            </select>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
        >
          {isLoading
            ? "Please wait..."
            : mode === "login"
            ? "Sign In"
            : "Sign Up"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-orange-600 hover:underline"
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  )
}