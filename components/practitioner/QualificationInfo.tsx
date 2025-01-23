"use client"

import { QualificationInfoProps } from "./types"

export function QualificationInfo({ qualification, consultationType, fee }: QualificationInfoProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="font-semibold text-gray-600">Qualification</h3>
        <p>{qualification || "Not set"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-600">Consultation Type</h3>
        <p className="capitalize">{consultationType}</p>
      </div>
      <div>
        <h3 className="font-semibold text-gray-600">Consultation Fee</h3>
        <p>₹{fee}</p>
      </div>
    </div>
  )
}