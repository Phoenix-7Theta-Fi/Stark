"use client"

import { BasicInfoProps } from "./types"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function BasicInfo({ name, age, experience, image }: BasicInfoProps) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <Avatar className="h-24 w-24">
          {image ? (
            <AvatarImage src={image} alt={name} className="object-cover" />
          ) : (
            <AvatarFallback className="text-lg">
              {name ? name.charAt(0).toUpperCase() : "P"}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
      <div className="flex-grow grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold text-gray-600">Name</h3>
          <p>{name || "Not set"}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-600">Age</h3>
          <p>{age} years</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-600">Experience</h3>
          <p>{experience} years</p>
        </div>
      </div>
    </div>
  )
}