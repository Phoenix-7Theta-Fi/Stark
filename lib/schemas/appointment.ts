import { z } from "zod";
import { ObjectId } from "mongodb";

// Custom ObjectId schema
const objectIdSchema = z.custom<ObjectId>((val) => {
  return val instanceof ObjectId || ObjectId.isValid(val as string);
});

export const AppointmentSchema = z.object({
  _id: objectIdSchema.optional(), // MongoDB ID
  patientId: z.string(),
  patientName: z.string(),
  practitionerId: z.string(),
  practitionerName: z.string(),
  date: z.string(),
  timeSlot: z.string(),
  consultationType: z.enum(["online", "in-person"]),
  notes: z.string().optional(),
  status: z.enum(["requested", "confirmed", "declined"]).default("requested"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Appointment = z.infer<typeof AppointmentSchema> & {
  _id?: string | ObjectId;
};

export const CreateAppointmentSchema = AppointmentSchema.omit({
  _id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;