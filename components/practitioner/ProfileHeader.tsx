"use client"

import { Button } from "@/components/ui/button"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileHeaderProps } from "./types"

export function ProfileHeader({ onEditProfile, onEditAvailability, editingTimeSlots }: ProfileHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-2xl text-orange-600">Profile</CardTitle>
      <div className="flex space-x-2">
        <Button variant="outline" onClick={onEditProfile}>
          Edit Profile
        </Button>
        <Button 
          variant="outline" 
          onClick={onEditAvailability}
        >
          {editingTimeSlots ? "Done Editing" : "Edit Availability"}
        </Button>
      </div>
    </CardHeader>
  )
}