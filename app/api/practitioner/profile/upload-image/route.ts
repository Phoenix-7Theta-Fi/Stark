import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import clientPromise from "@/lib/mongodb"
import { Binary } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const binary = new Binary(buffer)

    const client = await clientPromise
    const db = client.db()

    // Save the image in MongoDB
    const result = await db.collection("practitioner_images").insertOne({
      userId: session.user.id,
      image: binary,
      contentType: file.type,
      createdAt: new Date()
    })

    // Return the ObjectId as the image reference
    const imageId = result.insertedId.toString()

    // Update the practitioner profile with the image reference
    await db.collection("practitioners").updateOne(
      { userId: session.user.id },
      { $set: { imageId } }
    )

    // Return the image ID that we'll use as a reference
    return NextResponse.json({ imageId })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}