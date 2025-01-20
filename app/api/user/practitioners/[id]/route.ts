import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { PractitionerProfile } from "@/lib/schemas/practitioner"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("Fetching practitioner with ID:", params.id)

  const session = await getServerSession(authOptions)

  if (!session?.user) {
    console.log("Unauthorized: No session")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db()

    console.log("Querying practitionerProfiles collection with userId:", params.id)

    const practitioner = await db.collection("practitionerProfiles").findOne({
      userId: params.id
    }) as PractitionerProfile | null

    console.log("Query result:", JSON.stringify(practitioner, null, 2))

    if (!practitioner) {
      console.log("Practitioner not found")
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 })
    }

    return NextResponse.json(practitioner)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}