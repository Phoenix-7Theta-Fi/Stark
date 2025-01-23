import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { Blog, BlogDocument } from "@/types/blog"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const practitionerId = searchParams.get('practitionerId')

    const client = await clientPromise
    const db = client.db("tweb")
    
    // Build query based on parameters
    const query = practitionerId 
      ? { "author.practitionerId": practitionerId }
      : {}

    const blogs = await db
      .collection<BlogDocument>("blogs")
      .find(query)
      .sort({ createdAt: -1 }) // Latest first
      .toArray()

    // Convert to frontend/API format
    const serializedBlogs: Blog[] = blogs.map(blog => ({
      ...blog,
      _id: blog._id.toString(),
      createdAt: blog.createdAt?.toISOString(),
      updatedAt: blog.updatedAt?.toISOString(),
      embeddings: [{
        text: `${blog.title} ${blog.description}`, // Combine title and description as the text chunk
        vector: blog.embedding
      }]
    }))

    return NextResponse.json(serializedBlogs)
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}