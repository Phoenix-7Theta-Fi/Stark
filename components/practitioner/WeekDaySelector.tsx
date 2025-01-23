"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { WeekDaySelectorProps } from "./types"

export function WeekDaySelector({ 
  days, 
  selectedDay, 
  editingTimeSlots, 
  availability,
  onDaySelect,
  onToggleDay 
}: WeekDaySelectorProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {days.map((day) => (
          <Button
            key={day}
            variant={selectedDay === day ? "default" : "outline"}
            className={`min-w-[100px] ${!editingTimeSlots && !availability[day].enabled ? "opacity-50" : ""}`}
            onClick={() => {
              if (editingTimeSlots) {
                onToggleDay(day)
              }
              onDaySelect(day)
            }}
          >
            {day}
            {editingTimeSlots && (
              <span 
                className={`ml-2 ${
                  availability[day].enabled 
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
  )
}