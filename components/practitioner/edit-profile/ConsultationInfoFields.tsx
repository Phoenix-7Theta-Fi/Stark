"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ConsultationInfoFieldsProps {
  consultationType: "online" | "in-person" | "both"
  fee: number
  onConsultationTypeChange: (value: "online" | "in-person" | "both") => void
  onFeeChange: (value: number) => void
}

export function ConsultationInfoFields({
  consultationType,
  fee,
  onConsultationTypeChange,
  onFeeChange,
}: ConsultationInfoFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="consultationType">Consultation Type</Label>
        <Select
          value={consultationType}
          onValueChange={(value: "online" | "in-person" | "both") => onConsultationTypeChange(value)}
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
          value={fee}
          onChange={(e) => onFeeChange(parseInt(e.target.value))}
        />
      </div>
    </>
  )
}