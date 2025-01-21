import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import clientPromise from "@/lib/mongodb"
import { practitionerProfileSchema } from "@/lib/schemas/practitioner"

const defaultTimeSlots = [
  { start: "09:00", end: "10:00", available: true },
  { start: "10:00", end: "11:00", available: true },
  { start: "11:00", end: "12:00", available: true },
  { start: "14:00", end: "15:00", available: true },
  { start: "15:00", end: "16:00", available: true },
  { start: "16:00", end: "17:00", available: true },
]

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db("tweb")
    
    const profile = await db.collection("practitionerProfiles").findOne({
      userId: session.user.id,
    })

    if (!profile) {
      // Create a default profile with per-day availability
      const defaultAvailability = weekDays.reduce((acc, day) => ({
        ...acc,
        [day]: {
          enabled: ["Monday", "Tuesday", "Wednesday", "Friday"].includes(day),
          timeSlots: defaultTimeSlots,
        },
      }), {})

      const defaultProfile = {
        userId: session.user.id,
        name: session.user.name || "",
        age: 30,
        experience: 0,
        qualification: "",
        consultationType: "both",
        fee: 0,
        availability: defaultAvailability,
        updatedAt: new Date(),
      }

      await db.collection("practitionerProfiles").insertOne(defaultProfile)
      return NextResponse.json(defaultProfile)
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Add the userId to the data before validation
    const validatedData = practitionerProfileSchema.parse({
      ...data,
      userId: session.user.id,
    })

    const client = await clientPromise
    const db = client.db("tweb")

    // Update profile
    const result = await db.collection("practitionerProfiles").updateOne(
      { userId: session.user.id },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    )

    if (!result.acknowledged) {
      throw new Error("Failed to update profile")
    }

    // Fetch and return the updated profile
    const updatedProfile = await db.collection("practitionerProfiles").findOne({
      userId: session.user.id,
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Error updating profile:", error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}