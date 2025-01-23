"use client"

import { Button } from "@/components/ui/button"
import { TimeSlotGridProps } from "./types"

export function TimeSlotGrid({ 
  day, 
  timeSlots, 
  editingTimeSlots, 
  onToggleTimeSlot 
}: TimeSlotGridProps) {
  return (
    <div>
      <h3 className="font-semibold text-gray-600 mb-2">
        Time Slots for {day}
        {editingTimeSlots && (
          <span className="ml-2 text-sm text-gray-500">
            (Click slots to toggle availability)
          </span>
        )}
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {timeSlots.map((slot, index) => (
          <Button
            key={`${day}-${slot.start}-${slot.end}`}
            variant={slot.available ? "outline" : "ghost"}
            className={`w-full ${
              editingTimeSlots 
                ? "cursor-pointer hover:bg-gray-100" 
                : slot.available 
                  ? "" 
                  : "opacity-50"
            }`}
            onClick={() => editingTimeSlots && onToggleTimeSlot(index)}
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
  )
}