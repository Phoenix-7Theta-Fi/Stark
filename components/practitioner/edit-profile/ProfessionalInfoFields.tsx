"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProfessionalInfoFieldsProps {
  experience: number
  qualification: string
  onExperienceChange: (value: number) => void
  onQualificationChange: (value: string) => void
}

export function ProfessionalInfoFields({
  experience,
  qualification,
  onExperienceChange,
  onQualificationChange,
}: ProfessionalInfoFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="experience">Experience (years)</Label>
        <Input
          id="experience"
          type="number"
          value={experience}
          onChange={(e) => onExperienceChange(parseInt(e.target.value))}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="qualification">Qualification</Label>
        <Input
          id="qualification"
          value={qualification}
          onChange={(e) => onQualificationChange(e.target.value)}
        />
      </div>
    </>
  )
}