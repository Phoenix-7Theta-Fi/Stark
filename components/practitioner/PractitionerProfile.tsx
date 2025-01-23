"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ProfileData, defaultProfile, weekDays } from "./types"
import { ProfileHeader } from "./ProfileHeader"
import { BasicInfo } from "./BasicInfo"
import { QualificationInfo } from "./QualificationInfo"
import { WeekDaySelector } from "./WeekDaySelector"
import { TimeSlotGrid } from "./TimeSlotGrid"
import { EditProfileForm } from "./edit-profile/EditProfileForm"

export function PractitionerProfile() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editingTimeSlots, setEditingTimeSlots] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfile)

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/practitioner/profile")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch profile")
      }
      const data = await response.json()

      // Initialize availability with default structure if not present
      const availability = weekDays.reduce((acc, day) => {
        const existingDay = data.availability?.[day] || {}
        return {
          ...acc,
          [day]: {
            enabled: existingDay.enabled ?? true,
            timeSlots: existingDay.timeSlots || defaultProfile.availability[day].timeSlots,
          },
        }
      }, {})

      setProfileData({
        name: data.name || "",
        age: data.age || 30,
        experience: data.experience || 0,
        qualification: data.qualification || "",
        consultationType: data.consultationType || "both",
        fee: data.fee || 0,
        image: data.image || "",
        availability,
      })

      if (!selectedDay) {
        setSelectedDay("Monday")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, selectedDay])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleToggleDay = async (day: string) => {
    const updatedAvailability = {
      ...profileData.availability,
      [day]: {
        ...profileData.availability[day],
        enabled: !profileData.availability[day].enabled,
      },
    }

    try {
      const response = await fetch("/api/practitioner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileData,
          availability: updatedAvailability,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update availability")
      }

      const data = await response.json()
      setProfileData({
        ...profileData,
        availability: data.availability,
      })
      toast({
        title: "Success",
        description: `${day} availability updated`,
      })
    } catch (error) {
      console.error("Error updating availability:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update availability",
        variant: "destructive",
      })
    }
  }

  const handleToggleTimeSlot = async (index: number) => {
    if (!selectedDay) return

    const updatedTimeSlots = profileData.availability[selectedDay].timeSlots.map((slot, i) => 
      i === index ? { ...slot, available: !slot.available } : { ...slot }
    )

    const updatedAvailability = {
      ...profileData.availability,
      [selectedDay]: {
        ...profileData.availability[selectedDay],
        timeSlots: updatedTimeSlots,
      },
    }

    try {
      const response = await fetch("/api/practitioner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...profileData,
          availability: updatedAvailability,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update time slot")
      }

      const data = await response.json()
      setProfileData({
        ...profileData,
        availability: data.availability,
      })

      toast({
        title: "Success",
        description: `Time slot updated for ${selectedDay}`,
      })
    } catch (error) {
      console.error("Error updating time slot:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update time slot",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-500">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <ProfileHeader
        onEditProfile={() => setIsEditing(true)}
        onEditAvailability={() => {
          setEditingTimeSlots(!editingTimeSlots)
          if (!editingTimeSlots && !selectedDay) {
            setSelectedDay("Monday")
          }
        }}
        editingTimeSlots={editingTimeSlots}
      />
      <CardContent className="space-y-6">
        <BasicInfo
          name={profileData.name}
          age={profileData.age}
          experience={profileData.experience}
          image={profileData.image}
        />
        <QualificationInfo
          qualification={profileData.qualification}
          consultationType={profileData.consultationType}
          fee={profileData.fee}
        />
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-600">Availability</h3>
            {editingTimeSlots && (
              <p className="text-sm text-gray-500">
                Click days to enable/disable, then select a day to edit time slots
              </p>
            )}
          </div>
          <WeekDaySelector
            days={weekDays}
            selectedDay={selectedDay}
            editingTimeSlots={editingTimeSlots}
            availability={profileData.availability}
            onDaySelect={setSelectedDay}
            onToggleDay={handleToggleDay}
          />
        </div>

        {selectedDay && (
          <TimeSlotGrid
            day={selectedDay}
            timeSlots={profileData.availability[selectedDay].timeSlots}
            editingTimeSlots={editingTimeSlots}
            onToggleTimeSlot={handleToggleTimeSlot}
          />
        )}

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <EditProfileForm
              profileData={profileData}
              setProfileData={setProfileData}
              onClose={() => setIsEditing(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
