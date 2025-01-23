"use client"

import { Session } from "next-auth"
import { Card } from "@/components/ui/card"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { useEffect, useState } from "react"
import { PractitionerProfile } from "@/lib/schemas/practitioner"
import { toast } from "@/hooks/use-toast"
import { BadgeCheck, ChevronRight } from "lucide-react"
import Link from "next/link"

interface AdminDashboardClientProps {
  session: Session
}

export default function AdminDashboardClient({ session }: AdminDashboardClientProps) {
  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPractitioners()
  }, [])

  const fetchPractitioners = async () => {
    try {
      const response = await fetch("/api/admin/practitioners")
      if (!response.ok) throw new Error("Failed to fetch practitioners")
      const data = await response.json()
      setPractitioners(data)
    } catch (error) {
      console.error("Error fetching practitioners:", error)
      toast({
        title: "Error",
        description: "Failed to load practitioners",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (practitionerId: string) => {
    try {
      const response = await fetch(`/api/admin/practitioners/${practitionerId}/verify`, {
        method: "PATCH",
      })

      if (!response.ok) throw new Error("Failed to verify practitioner")

      toast({
        title: "Success",
        description: "Practitioner verified successfully",
      })

      // Update practitioners list
      fetchPractitioners()
    } catch (error) {
      console.error("Error verifying practitioner:", error)
      toast({
        title: "Error",
        description: "Failed to verify practitioner",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome, {session.user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold text-lg">Admin Information</h2>
            <p className="text-gray-600">Email: {session.user.email}</p>
            <p className="text-gray-600">Role: {session.user.role}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Total Users</h3>
            <p className="text-2xl font-bold mt-2">-</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Total Practitioners</h3>
            <p className="text-2xl font-bold mt-2">{practitioners.length}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium">Total Appointments</h3>
            <p className="text-2xl font-bold mt-2">-</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Practitioners Management</h2>
        {loading ? (
          <div className="text-center text-gray-600">Loading practitioners...</div>
        ) : practitioners.length === 0 ? (
          <div className="text-center text-gray-600">No practitioners found</div>
        ) : (
          <div className="divide-y">
            {practitioners.map((practitioner) => (
              <div 
                key={practitioner.userId} 
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{practitioner.name}</h3>
                      {practitioner.isVerified && (
                        <BadgeCheck className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {practitioner.qualification} • {practitioner.experience}+ years
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!practitioner.isVerified && (
                    <button
                      onClick={() => handleVerify(practitioner.userId)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Verify
                    </button>
                  )}
                  <Link
                    href={`/user/practitioners/${practitioner.userId}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    View Profile
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}