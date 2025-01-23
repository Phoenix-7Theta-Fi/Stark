import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { redirect } from "next/navigation"
import AdminDashboardClient from "./AdminDashboardClient"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    redirect("/")
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminDashboardClient session={session} />
    </main>
  )
}