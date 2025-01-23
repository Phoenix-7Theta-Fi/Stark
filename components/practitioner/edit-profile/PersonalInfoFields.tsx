"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface PersonalInfoFieldsProps {
  name: string
  age: number
  image?: string
  onNameChange: (value: string) => void
  onAgeChange: (value: number) => void
  onImageChange: (file: File) => void
}

export function PersonalInfoFields({
  name,
  age,
  image,
  onNameChange,
  onAgeChange,
  onImageChange,
}: PersonalInfoFieldsProps) {
  return (
    <>
      <div className="grid gap-4">
        <div className="flex items-center gap-4">
          {image && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden">
              <Image
                src={image}
                alt="Profile picture"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="image">Profile Picture</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                className="max-w-[250px]"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    onImageChange(file)
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          value={age}
          onChange={(e) => onAgeChange(parseInt(e.target.value))}
        />
      </div>
    </>
  )
}