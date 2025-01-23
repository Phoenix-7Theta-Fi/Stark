import { getServerSession } from "next-auth/next"
import { AuthForm } from "@/components/auth/AuthForm"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is authenticated, redirect based on role
  if (session?.user) {
    switch (session.user.role) {
      case "admin":
        redirect("/admin")
      case "practitioner":
        redirect("/practitioner")
      case "user":
        redirect("/user")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <AuthForm />
    </main>
  )
}
