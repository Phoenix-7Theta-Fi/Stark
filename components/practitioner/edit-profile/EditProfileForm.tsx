"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { ProfileData } from "../types"
import { PersonalInfoFields } from "./PersonalInfoFields"
import { ProfessionalInfoFields } from "./ProfessionalInfoFields"
import { ConsultationInfoFields } from "./ConsultationInfoFields"
import { useState } from "react"

interface EditProfileFormProps {
  profileData: ProfileData
  setProfileData: (data: ProfileData) => void
  onClose: () => void
}

export function EditProfileForm({ 
  profileData, 
  setProfileData, 
  onClose 
}: EditProfileFormProps) {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/practitioner/profile/upload-image", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    // Convert imageId to full URL for fetching the image
    return `/api/practitioner/profile/image/${data.imageId}`
  }

  const handleImageChange = async (file: File) => {
    try {
      setIsUploading(true)
      const imageUrl = await uploadImage(file)
      setProfileData({ ...profileData, image: imageUrl })
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        ...updatedData,
        availability: updatedData.availability,
        image: updatedData.image, // Make sure to keep the image URL
      })

      onClose()
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PersonalInfoFields
        name={profileData.name}
        age={profileData.age}
        image={profileData.image}
        onNameChange={(value) => setProfileData({ ...profileData, name: value })}
        onAgeChange={(value) => setProfileData({ ...profileData, age: value })}
        onImageChange={handleImageChange}
      />
      <ProfessionalInfoFields
        experience={profileData.experience}
        qualification={profileData.qualification}
        onExperienceChange={(value) => setProfileData({ ...profileData, experience: value })}
        onQualificationChange={(value) => setProfileData({ ...profileData, qualification: value })}
      />
      <ConsultationInfoFields
        consultationType={profileData.consultationType}
        fee={profileData.fee}
        onConsultationTypeChange={(value) => setProfileData({ ...profileData, consultationType: value })}
        onFeeChange={(value) => setProfileData({ ...profileData, fee: value })}
      />
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Save Changes"}
      </Button>
    </form>
  )
}