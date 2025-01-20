import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import clientPromise from "@/lib/mongodb"
import { BlogDocument } from "@/types/blog"
import { ObjectId } from 'mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is a practitioner
    if (!session || session.user.role !== "practitioner") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const authorData = formData.get('author') as string
    const readTime = formData.get('readTime') as string
    const image = formData.get('image') as File | null

    if (!title || !description || !authorData || !readTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const author = JSON.parse(authorData)

    // Handle image upload if present
    let backgroundImage: string | undefined
    if (image) {
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
      const ext = image.name.split('.').pop()
      const filename = `${uniqueSuffix}.${ext}`
      
      // Ensure uploads directory exists and create if it doesn't
      const uploadDir = join(process.cwd(), 'public', 'uploads')
      try {
        await mkdir(uploadDir, { recursive: true })
      } catch (error) {
        // Ignore error if directory already exists
      }
      
      await writeFile(join(uploadDir, filename), buffer)
      backgroundImage = `/uploads/${filename}`
    }

    const client = await clientPromise
    const db = client.db("tweb")

    // Create blog post with explicit Date
    const createdAt = new Date()
    const blog: BlogDocument = {
      _id: new ObjectId(),
      title,
      description,
      author,
      readTime,
      ...(backgroundImage && { backgroundImage }),
      createdAt
    }

    const result = await db
      .collection<BlogDocument>("blogs")
      .insertOne(blog)

    // Return the created blog
    const createdBlog = {
      ...blog,
      _id: result.insertedId.toString(),
      createdAt: createdAt.toISOString()
    }

    return NextResponse.json(createdBlog, { status: 201 })
  } catch (error) {
    console.error("Error creating blog:", error)
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    )
  }
}