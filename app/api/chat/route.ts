import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { generateEmbedding } from "@/lib/embeddings";

const GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const LLM_MODEL_NAME = "gemini-1.5-flash-8b";

const genAI = new GoogleGenerativeAI(GENERATIVE_AI_API_KEY || "");
const llmModel = genAI.getGenerativeModel({ model: LLM_MODEL_NAME });

interface BlogResult {
  title: string;
  description: string;
  score: number;
}

interface FormattedBlogResult {
  title: string;
  content: string;
}

async function getBlogEmbeddings(db: Db, queryEmbedding: number[]): Promise<string[]> {
  console.log("Starting vector search...");

  try {
    const pipeline = [
      {
        "$vectorSearch": {
          "index": "blogEmbeddingsV2",
          "path": "embedding",
          "queryVector": queryEmbedding,
          "numCandidates": 100,
          "limit": 5
        }
      },
      {
        $project: {
          _id: 0,
          title: 1,
          description: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    console.log("Running vector search with pipeline:", JSON.stringify(pipeline, null, 2));
    const results = await db.collection("blogs").aggregate<BlogResult>(pipeline).toArray();
    
    console.log("Vector search results:", {
      count: results.length,
      scores: results.map((r: BlogResult) => r.score),
      contentPreviews: results.map((r: BlogResult) => `${r.title}: ${r.description.substring(0, 100)}...`)
    });

    // Format blog content for prompt
    return results.map((doc: BlogResult) => `
Title: ${doc.title}
Description: ${doc.description}
Full content: ${doc.description}`);
  } catch (error) {
    console.error("Error querying embeddings:", error);
    return [];
  }
}

export async function POST(req: Request) {
  const client = await clientPromise;
  const db = client.db("tweb");
  
  try {
    const { message } = await req.json();

    if (!GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_AI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("Processing query:", message);

    // 1. Generate embedding for the query
    const enhancedQuery = `
Title: Find information about ${message}
Keywords: ${message.toLowerCase().split(/\s+/).join(', ')}
Description: Find detailed information about ${message}
This article discusses: ${message}
Key concepts covered: ${message.toLowerCase()}
Full content: Tell me about ${message}`;

    console.log("Enhanced query:", enhancedQuery);
    const queryEmbedding = await generateEmbedding(enhancedQuery);
    console.log("Generated query embedding with dimensions:", queryEmbedding.length);

    // Check blogs collection status
    const allBlogs = await db.collection("blogs").find({}).toArray();
    console.log("Blogs collection status:", {
      totalBlogs: allBlogs.length,
      blogsWithEmbeddings: allBlogs.filter(b => b.embedding).length,
      blogTitles: allBlogs.map(b => b.title)
    });

    // Check if any documents have embeddings
    const sampleDoc = await db.collection("blogs").findOne(
      { embedding: { $exists: true } }
    );
    console.log("Sample blog document with embedding:",
      sampleDoc ? {
        title: sampleDoc.title,
        hasEmbedding: !!sampleDoc.embedding,
        embeddingLength: sampleDoc.embedding?.length,
        embeddingSample: sampleDoc.embedding?.slice(0, 5)
      } : "No blogs found with embeddings"
    );

    // 2. Query MongoDB for similar blog post embeddings
    const relevantBlogs = await getBlogEmbeddings(db, queryEmbedding);
    console.log(`Found ${relevantBlogs.length} relevant blog sections`);

    // 3. Augment the prompt with retrieved content
    console.log("Constructing prompt with relevant content");
    // Extract titles and content for better context
    const relevantContent: FormattedBlogResult[] = relevantBlogs.map((content: string) => {
      const titleMatch = content.match(/Title: (.*?)(?:\n|$)/);
      const contentMatch = content.match(/Full content: (.*?)(?:\n|$)/);
      return {
        title: titleMatch ? titleMatch[1] : '',
        content: contentMatch ? contentMatch[1] : content
      };
    });

    const context = relevantContent.length > 0
      ? relevantContent.map((item: FormattedBlogResult) => `Source: ${item.title}\n${item.content}`).join('\n\n---\n\n')
      : "No relevant blog posts found.";

    const prompt = `You are an experienced Ayurvedic expert assistant. Your task is to provide accurate and helpful information based on our blog content.

${relevantContent.length > 0
  ? `I found relevant information in our Ayurvedic blog posts that can help answer this question about "${message}".

Available sources:
${relevantContent.map(item => `- ${item.title}`).join('\n')}

Detailed content:
${context}

Based on these blog posts, please provide a clear and thorough answer. Explain Ayurvedic concepts in an accessible way and reference specific information from the blog posts.`
  :
  `I've searched our blog posts but couldn't find specific information about "${message}". Please let the user know we don't currently have content covering this topic in our blog posts.`}

Question: ${message}

Provide a detailed answer:`;

    // 4. Generate content using the model
    const result = await llmModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    
    // More descriptive error messages based on the error type
    let errorMessage = "Failed to generate response";
    if (error instanceof Error) {
      if (error.message.includes("embedContent")) {
        errorMessage = "Error generating embeddings for the query";
      } else if (error.message.includes("generateContent")) {
        errorMessage = "Error generating AI response";
      }
      console.error("Error details:", error.message);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}