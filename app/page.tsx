import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { AuthForm } from "@/components/auth/AuthForm"

export default async function Home() {
  const session = await getServerSession(authOptions)
  
  if (session?.user) {
    redirect(session.user.role === "practitioner" ? "/practitioner" : "/user")
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-orange-50">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-orange-600 mb-2">Tangerine</h1>
        <p className="text-gray-600">Your trusted Ayurvedic wellness platform</p>
      </div>
      <AuthForm />
    </main>
  )
}
