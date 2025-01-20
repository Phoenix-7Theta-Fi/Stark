"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeSlot, DayAvailability } from "@/lib/schemas/practitioner"
import { useToast } from "@/hooks/use-toast"

interface ProfileData {
  name: string
  age: number
  experience: number
  qualification: string
  consultationType: "online" | "in-person" | "both"
  fee: number
  availability: Record<string, DayAvailability>
}

const defaultTimeSlots: TimeSlot[] = [
  { start: "09:00", end: "10:00", available: true },
  { start: "10:00", end: "11:00", available: true },
  { start: "11:00", end: "12:00", available: true },
  { start: "14:00", end: "15:00", available: true },
  { start: "15:00", end: "16:00", available: true },
  { start: "16:00", end: "17:00", available: true },
]

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const defaultProfile: ProfileData = {
  name: "",
  age: 30,
  experience: 0,
  qualification: "",
  consultationType: "both",
  fee: 0,
  availability: weekDays.reduce((acc, day) => ({
    ...acc,
    [day]: {
      enabled: true,
      timeSlots: defaultTimeSlots.map(slot => ({ ...slot })),
    },
  }), {}),
}

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
            timeSlots: existingDay.timeSlots || defaultTimeSlots.map(slot => ({ ...slot })),
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/practitioner/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      const updatedData = await response.json()
      setProfileData({
        name: updatedData.name,
        age: updatedData.age,
        experience: updatedData.experience,
        qualification: updatedData.qualification,
        consultationType: updatedData.consultationType,
        fee: updatedData.fee,
        availability: updatedData.availability,
      })

      setIsEditing(false)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    }
  }

   const toggleDayEnabled = async (day: string) => {
    const updatedAvailability = {
      ...profileData.availability,
      [day]: {
        ...profileData.availability[day],
        enabled: !profileData.availability[day].enabled,
         timeSlots: profileData.availability[day].timeSlots.map(slot => ({ ...slot })),
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


  const toggleTimeSlot = async (day: string, slotIndex: number) => {
      const updatedTimeSlots = profileData.availability[day].timeSlots.map((slot, index) => 
      index === slotIndex ? { ...slot, available: !slot.available } : { ...slot }
    )


    const updatedAvailability = {
      ...profileData.availability,
      [day]: {
        ...profileData.availability[day],
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
        description: `Time slot updated for ${day}`,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl text-orange-600">Profile</CardTitle>
        <div className="flex space-x-2">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        age: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profileData.experience}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        experience: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={profileData.qualification}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        qualification: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="consultationType">Consultation Type</Label>
                  <Select
                    value={profileData.consultationType}
                    onValueChange={(value: "online" | "in-person" | "both") =>
                      setProfileData({ ...profileData, consultationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fee">Consultation Fee</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={profileData.fee}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        fee: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            onClick={() => {
              setEditingTimeSlots(!editingTimeSlots)
              if (!editingTimeSlots && !selectedDay) {
                setSelectedDay("Monday")
              }
            }}
          >
            {editingTimeSlots ? "Done Editing" : "Edit Availability"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-600">Name</h3>
            <p>{profileData.name || "Not set"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Age</h3>
            <p>{profileData.age} years</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Experience</h3>
            <p>{profileData.experience} years</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Qualification</h3>
            <p>{profileData.qualification || "Not set"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Consultation Type</h3>
            <p className="capitalize">{profileData.consultationType}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-600">Consultation Fee</h3>
            <p>₹{profileData.fee}</p>
          </div>
        </div>

       <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-600">Availability</h3>
            {editingTimeSlots && (
              <p className="text-sm text-gray-500">
                Click days to enable/disable, then select a day to edit time slots
              </p>
            )}
          </div>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-4 p-4">
              {weekDays.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                    className={`min-w-[100px] ${!editingTimeSlots && !profileData.availability[day].enabled ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (editingTimeSlots) {
                      toggleDayEnabled(day)
                    }
                    setSelectedDay(day)
                  }}
                >
                  {day}
                  {editingTimeSlots && (
                    <span 
                      className={`ml-2 ${
                        profileData.availability[day].enabled 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}
                    >
                      •
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {selectedDay && (
          <div>
            <h3 className="font-semibold text-gray-600 mb-2">
              Time Slots for {selectedDay}
               {editingTimeSlots && (
                <span className="ml-2 text-sm text-gray-500">
                  (Click slots to toggle availability)
                </span>
              )}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {profileData.availability[selectedDay].timeSlots.map((slot, index) => (
                <Button
                  key={`${selectedDay}-${slot.start}-${slot.end}`}
                  variant={slot.available ? "outline" : "ghost"}
                   className={`w-full ${
                    editingTimeSlots 
                      ? "cursor-pointer hover:bg-gray-100" 
                      : slot.available 
                        ? "" 
                        : "opacity-50"
                  }`}
                   onClick={() => editingTimeSlots && toggleTimeSlot(selectedDay, index)}
                   disabled={!editingTimeSlots && !slot.available}
                >
                  {slot.start} - {slot.end}
                  {editingTimeSlots && (
                    <span 
                      className={`ml-2 ${
                        slot.available 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}
                    >
                      •
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
