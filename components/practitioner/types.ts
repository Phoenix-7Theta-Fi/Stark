import { TimeSlot, DayAvailability } from "@/lib/schemas/practitioner"

export interface ProfileData {
  name: string
  age: number
  experience: number
  qualification: string
  consultationType: "online" | "in-person" | "both"
  fee: number
  availability: Record<string, DayAvailability>
  image?: string
}

export interface ProfileHeaderProps {
  onEditProfile: () => void
  onEditAvailability: () => void
  editingTimeSlots: boolean
}

export interface BasicInfoProps {
  name: string
  age: number
  experience: number
  image?: string
}

export interface QualificationInfoProps {
  qualification: string
  consultationType: string
  fee: number
}

export interface TimeSlotGridProps {
  day: string
  timeSlots: TimeSlot[]
  editingTimeSlots: boolean
  onToggleTimeSlot: (index: number) => void
}

export interface WeekDaySelectorProps {
  days: string[]
  selectedDay: string | null
  editingTimeSlots: boolean
  availability: Record<string, DayAvailability>
  onDaySelect: (day: string) => void
  onToggleDay: (day: string) => void
}

export const defaultTimeSlots: TimeSlot[] = [
  { start: "09:00", end: "10:00", available: true },
  { start: "10:00", end: "11:00", available: true },
  { start: "11:00", end: "12:00", available: true },
  { start: "14:00", end: "15:00", available: true },
  { start: "15:00", end: "16:00", available: true },
  { start: "16:00", end: "17:00", available: true },
]

export const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const defaultProfile: ProfileData = {
  name: "",
  age: 30,
  experience: 0,
  qualification: "",
  consultationType: "both",
  fee: 0,
  image: "",
  availability: weekDays.reduce((acc, day) => ({
    ...acc,
    [day]: {
      enabled: true,
      timeSlots: defaultTimeSlots.map(slot => ({ ...slot })),
    },
  }), {}),
}