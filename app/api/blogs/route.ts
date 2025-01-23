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

    // Fetch all unique practitioner userIds from blogs
    const practitionerUserIds = Array.from(new Set(blogs.map(blog => blog.author.practitionerId)))

    // Get practitioner profiles in one query
    const practitionerProfiles = await db.collection("practitionerProfiles").find(
      { userId: { $in: practitionerUserIds } },
      { projection: { userId: 1, imageId: 1 } }
    ).toArray()

    // Create a map of userId to imageId for quick lookup
    const practitionerImageMap = new Map(
      practitionerProfiles.map(p => [p.userId, p.imageId?.toString()])
    )

    // Convert to frontend/API format
    const serializedBlogs: Blog[] = blogs.map(blog => {
      const practitionerImageId = practitionerImageMap.get(blog.author.practitionerId)
      return {
        ...blog,
        _id: blog._id.toString(),
        createdAt: blog.createdAt?.toISOString(),
        updatedAt: blog.updatedAt?.toISOString(),
        author: {
          ...blog.author,
          // Construct proper avatar URL only if practitioner has an image
          avatar: practitionerImageId 
            ? `/api/practitioner/profile/image/${practitionerImageId}`
            : blog.author.avatar // fallback to existing avatar if any
        },
        embeddings: [{
          text: `${blog.title} ${blog.description}`,
          vector: blog.embedding
        }]
      }
    })

    return NextResponse.json(serializedBlogs)
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}