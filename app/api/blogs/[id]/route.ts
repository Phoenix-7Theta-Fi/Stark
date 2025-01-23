import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import clientPromise from "@/lib/mongodb"
import { BlogDocument } from "@/types/blog"
import { ObjectId } from 'mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateEmbeddingsForChunks, prepareBlogForEmbedding } from "@/lib/embeddings"

// Gets a single blog post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("tweb")

    const blog = await db
      .collection<BlogDocument>("blogs")
      .findOne({ _id: new ObjectId(params.id) })

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...blog,
      _id: blog._id.toString(),
      createdAt: blog.createdAt?.toISOString(),
      updatedAt: blog.updatedAt?.toISOString()
    })
  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

// Updates a blog post
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const readTime = formData.get('readTime') as string
    const image = formData.get('image') as File | null

    if (!title || !description || !readTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

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

    // Check for Google AI API key first
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error("GOOGLE_AI_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error: Missing AI API key" },
        { status: 500 }
      )
    }

    // Generate embeddings for updated content
    const contentChunks = await prepareBlogForEmbedding(title, description)
      .catch(error => {
        console.error("Error preparing blog content:", error);
        throw new Error("Failed to prepare blog content for embedding");
      });

    if (!contentChunks || contentChunks.length === 0) {
      console.error("No valid content chunks generated");
      return NextResponse.json(
        { error: "Failed to process blog content - no valid text found after sanitization" },
        { status: 400 }
      );
    }

    const embedding = await generateEmbeddingsForChunks(contentChunks)
      .catch(error => {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate blog embedding - blogs require embedding for RAG pipeline");
      });

    if (!embedding || embedding.length === 0) {
      console.error("Invalid embedding generated");
      return NextResponse.json(
        { error: "Failed to generate valid embedding for blog content" },
        { status: 500 }
      );
    }

    // Start MongoDB session for transaction
    const mongoSession = await client.startSession();
    let updatedBlog;
    
    try {
      await mongoSession.startTransaction();

      // Get the existing blog to check ownership
      const existingBlog = await db
        .collection<BlogDocument>("blogs")
        .findOne(
          { _id: new ObjectId(params.id) },
          { session: mongoSession }
        );

      if (!existingBlog) {
        throw new Error("Blog not found");
      }

      // Check if the current user is the author of the blog
      if (existingBlog.author.practitionerId !== session.user.id) {
        throw new Error("Unauthorized - you can only edit your own blogs");
      }

      // Update the blog
      const updateResult = await db
        .collection<BlogDocument>("blogs")
        .updateOne(
          { _id: new ObjectId(params.id) },
          {
            $set: {
              title,
              description,
              readTime,
              embedding,
              ...(backgroundImage && { backgroundImage }),
              updatedAt: new Date()
            }
          },
          { session: mongoSession }
        );

      if (updateResult.modifiedCount === 0) {
        throw new Error("Failed to update blog");
      }

      // Get the updated blog
      const updated = await db
        .collection<BlogDocument>("blogs")
        .findOne(
          { _id: new ObjectId(params.id) },
          { session: mongoSession }
        );

      if (!updated) {
        throw new Error("Failed to fetch updated blog");
      }

      updatedBlog = {
        ...updated,
        _id: updated._id.toString(),
        createdAt: updated.createdAt?.toISOString(),
        updatedAt: updated.updatedAt?.toISOString()
      };

      await mongoSession.commitTransaction();
      return NextResponse.json(updatedBlog);
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error("Error updating blog:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update blog" },
      { status: 500 }
    )
  }
}

// Deletes a blog post
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is a practitioner
    if (!session || session.user.role !== "practitioner") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db("tweb")

    // Start MongoDB session for transaction
    const mongoSession = await client.startSession();
    
    try {
      await mongoSession.startTransaction();

      // Get the blog to check ownership
      const blog = await db
        .collection<BlogDocument>("blogs")
        .findOne(
          { _id: new ObjectId(params.id) },
          { session: mongoSession }
        );

      if (!blog) {
        throw new Error("Blog not found");
      }

      // Check if the current user is the author of the blog
      if (blog.author.practitionerId !== session.user.id) {
        throw new Error("Unauthorized - you can only delete your own blogs");
      }

      // Delete the blog
      const deleteResult = await db
        .collection<BlogDocument>("blogs")
        .deleteOne(
          { _id: new ObjectId(params.id) },
          { session: mongoSession }
        );

      if (deleteResult.deletedCount === 0) {
        throw new Error("Failed to delete blog");
      }

      await mongoSession.commitTransaction();
      return NextResponse.json({ message: "Blog deleted successfully" });
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete blog" },
      { status: 500 }
    )
  }
}