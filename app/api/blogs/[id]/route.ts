import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { Blog, BlogDocument } from "@/types/blog"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ObjectId format
    if (!ObjectId.isValid(params.id)) {
      return new NextResponse("Invalid blog ID format", { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("tweb")
    const blogCollection = db.collection<BlogDocument>("blogs")

    const blog = await blogCollection.findOne({
      _id: new ObjectId(params.id)
    })

    if (!blog) {
      return new NextResponse("Blog not found", { status: 404 })
    }

    // Convert to frontend/API format
    const serializedBlog: Blog = {
      ...blog,
      _id: blog._id.toString(),
      createdAt: blog.createdAt?.toISOString(),
      author: {
        ...blog.author,
        practitionerId: blog.author.practitionerId // Use the stored practitionerId directly
      }
    }

    return NextResponse.json(serializedBlog)
  } catch (error) {
    console.error("Error fetching blog:", error)
    return new NextResponse(
      error instanceof Error ? error.message : "Internal Server Error", 
      { status: 500 }
    )
  }
}