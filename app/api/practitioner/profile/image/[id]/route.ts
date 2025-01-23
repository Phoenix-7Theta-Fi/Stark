import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db()

    const imageId = new ObjectId(params.id)
    const imageData = await db.collection("practitioner_images").findOne({
      _id: imageId
    })

    if (!imageData) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Create response with the binary image data
    const response = new NextResponse(imageData.image.buffer)
    response.headers.set("Content-Type", imageData.contentType)
    response.headers.set("Cache-Control", "public, max-age=31536000") // Cache for 1 year
    
    return response
  } catch (error) {
    console.error("Error serving image:", error)
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    )
  }
}