import { z } from "zod"

export const timeSlotSchema = z.object({
  start: z.string(),
  end: z.string(),
  available: z.boolean(),
})

export const dayAvailabilitySchema = z.object({
  enabled: z.boolean(),
  timeSlots: z.array(timeSlotSchema),
})

export const practitionerProfileSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  age: z.number().min(20).max(100),
  experience: z.number().min(0),
  qualification: z.string(),
  consultationType: z.enum(["online", "in-person", "both"]),
  fee: z.number().min(0),
  availability: z.record(z.string(), dayAvailabilitySchema),
  updatedAt: z.date().optional(),
})

export type TimeSlot = z.infer<typeof timeSlotSchema>
export type DayAvailability = z.infer<typeof dayAvailabilitySchema>
export type PractitionerProfile = z.infer<typeof practitionerProfileSchema>