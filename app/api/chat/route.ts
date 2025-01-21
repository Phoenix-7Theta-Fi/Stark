import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Db, ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { generateEmbedding } from "@/lib/embeddings";
import { Citation } from "@/types/chat";

const GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const LLM_MODEL_NAME = "gemini-1.5-flash-8b";

const genAI = new GoogleGenerativeAI(GENERATIVE_AI_API_KEY || "");
const llmModel = genAI.getGenerativeModel({ model: LLM_MODEL_NAME });

interface BlogResult {
  _id: string;
  title: string;
  description: string;
  score: number;
}

interface FormattedBlogResult {
  id: string;
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
          "numCandidates": 200,
          "limit": 10
        }
      },
      {
        $project: {
          _id: {
            $convert: {
              input: "$_id",
              to: "string"
            }
          },
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

    return results.map((doc: BlogResult) => `
Title: ${doc.title}
ID: ${doc._id}
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

    const allBlogs = await db.collection("blogs").find({}).toArray();
    console.log("Blogs collection status:", {
      totalBlogs: allBlogs.length,
      blogsWithEmbeddings: allBlogs.filter(b => b.embedding).length,
      blogsWithEmbeddingDetails: allBlogs.map(b => ({
        title: b.title,
        hasEmbedding: !!b.embedding,
        embeddingLength: b.embedding?.length,
        embeddingField: b.embedding ? 'present' : 'missing',
        embeddingType: b.embedding ? typeof b.embedding : 'N/A'
      }))
    });

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

    const relevantBlogs = await getBlogEmbeddings(db, queryEmbedding);
    console.log(`Found ${relevantBlogs.length} relevant blog sections`);

    const relevantContent: FormattedBlogResult[] = relevantBlogs.map((content: string) => {
      const titleMatch = content.match(/Title: (.*?)(?:\n|$)/);
      const idMatch = content.match(/ID: (.*?)(?:\n|$)/);
      const contentMatch = content.match(/Full content: (.*?)(?:\n|$)/);

      // Clean up the ID by removing any whitespace
      const id = idMatch ? idMatch[1].trim() : '';

      // Log the extracted ID for debugging
      console.log("Extracted blog ID:", { 
        title: titleMatch ? titleMatch[1] : '',
        rawId: idMatch ? idMatch[1] : '',
        cleanId: id
      });

      return {
        id,
        title: titleMatch ? titleMatch[1].trim() : '',
        content: contentMatch ? contentMatch[1].trim() : content.trim()
      };
    });

    const context = relevantContent.length > 0
      ? relevantContent.map((item: FormattedBlogResult) => `Source: ${item.title}\n${item.content}`).join('\n\n---\n\n')
      : "No relevant blog posts found.";

    const prompt = `You are an experienced Ayurvedic expert assistant. Your task is to provide accurate and helpful information based on our blog content.

${relevantContent.length > 0
  ? `I found relevant information in our Ayurvedic blog posts that can help answer this question about "${message}".

Available sources (ordered by relevance, most relevant first):
${relevantContent.map((item, i) => `[${i + 1}] ${item.title}`).join('\n')}

Detailed content:
${context}

Based on these blog posts, please provide a clear and thorough answer. When referencing information from a source, include its number in square brackets [1] immediately after the information. Focus on information from source [1] as it's most relevant.

Your response MUST have two parts separated by '---':
1. Your answer with inline citations [1]
2. A References section listing all cited sources

Example format:
[Your detailed answer with citations like this [1]]

---
References:
[1] Exact Blog Title As Listed Above
`
  :
  `I've searched our blog posts but couldn't find specific information about "${message}". Please let the user know we don't currently have content covering this topic in our blog posts.`}

Question: ${message}

Provide a detailed answer:
`;

    const result = await llmModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to separate content and references
    const parts = text.split('\n---\n');
    const content = parts[0];
    const referencesSection = parts[1]?.includes('References:') ? parts[1] : null;
    
    // Parse references from the content
    const references = referencesSection
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^\[(\d+)\]\s+(.+)$/);
        return match ? { index: parseInt(match[1]), title: match[2].trim() } : null;
      })
      .filter((ref): ref is { index: number; title: string } => ref !== null) ?? [];

    // Build citations array from references
    const citations = references.reduce<Citation[]>((acc, ref) => {
      // Find the matching blog content
      const source = relevantContent.find(item =>
        // Do a case-insensitive title comparison to ensure matches
        item.title.toLowerCase() === ref.title.toLowerCase()
      );
      
      if (source?.id) {
        const cleanId = source.id.trim();
        if (ObjectId.isValid(cleanId)) {
          acc.push({
            title: ref.title, // Use the exact title from the reference
            content: source.content,
            blogId: cleanId
          });
        }
      }
      return acc;
    }, []);

    console.log("Built citations:", citations);

    // Log citations for debugging
    console.log("Generated citations:", citations.map(c => ({
      title: c.title,
      blogId: c.blogId
    })));

    return NextResponse.json({
      response: content.trim(),
      citations: citations.length > 0 ? citations : undefined
    });
  } catch (error) {
    console.error("Chat API error:", error);
    
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