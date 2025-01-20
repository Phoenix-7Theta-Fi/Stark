import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { Blog, BlogDocument } from "@/types/blog"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("tweb")
    
    const blogs = await db
      .collection<BlogDocument>("blogs")
      .find({})
      .sort({ createdAt: -1 }) // Latest first
      .toArray()

    // Convert to frontend/API format
    const serializedBlogs: Blog[] = blogs.map(blog => ({
      ...blog,
      _id: blog._id.toString(),
      createdAt: blog.createdAt?.toISOString()
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