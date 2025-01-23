import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import clientPromise from "@/lib/mongodb"
import { BlogDocument } from "@/types/blog"
import { ObjectId } from 'mongodb'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateEmbeddingsForChunks, prepareBlogForEmbedding } from "@/lib/embeddings"

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

    const client = await clientPromise
    const db = client.db("tweb")

    // Get practitioner's current profile image ID before creating blog
    const practitionerProfile = await db.collection("practitionerProfiles").findOne(
      { userId: session.user.id },
      { projection: { imageId: 1, _id: 0 } }
    )

    // Parse author data but override with current profile image if available
    const author = {
      ...JSON.parse(authorData),
      avatar: practitionerProfile?.imageId 
        ? `/api/practitioner/profile/image/${practitionerProfile.imageId}`
        : JSON.parse(authorData).avatar // fallback to provided avatar
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

    // Check for Google AI API key first
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error("GOOGLE_AI_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error: Missing AI API key" },
        { status: 500 }
      )
    }

    // Generate single embedding from all content chunks
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

    // Log successful embedding generation
    console.log("Successfully generated embedding:", {
      chunks: contentChunks.length,
      embeddingLength: embedding.length,
      sampleEmbedding: embedding.slice(0, 5)
    });

    // Create blog post with explicit Date and embedding
    const createdAt = new Date()
    const blog: BlogDocument = {
      _id: new ObjectId(),
      title,
      description,
      author,
      readTime,
      embedding,
      ...(backgroundImage && { backgroundImage }),
      createdAt
    }

    // Start MongoDB session for transaction
    const mongoSession = await client.startSession();
    let createdBlog;
    
    try {
      // Start transaction
      await mongoSession.startTransaction();

      // Insert the blog post with embedding
      const result = await db
        .collection<BlogDocument>("blogs")
        .insertOne(blog, { session: mongoSession });

      // Prepare response
      createdBlog = {
        ...blog,
        _id: result.insertedId.toString(),
        createdAt: createdAt.toISOString()
      };

      // Commit the transaction
      await mongoSession.commitTransaction();
      return NextResponse.json(createdBlog, { status: 201 });
    } catch (error) {
      // Abort transaction on error
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  } catch (error) {
    console.error("Error creating blog:", error)
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    )
  }
}