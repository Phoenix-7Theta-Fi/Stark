import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Db } from "mongodb";
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
          "numCandidates": 100,
          "limit": 5
        }
      },
      {
        $project: {
          _id: 1,
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
      blogTitles: allBlogs.map(b => b.title)
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
      return {
        id: idMatch ? idMatch[1] : '',
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
${relevantContent.map((item, i) => `[${i + 1}] ${item.title}`).join('\n')}

Detailed content:
${context}

Based on these blog posts, please provide a clear and thorough answer. When you reference specific information from a blog post, include the reference number in square brackets immediately after the information. Only cite sources that you actually use in your answer.

Format your response in exactly this format:

[Your detailed answer with in-text citations [1], [2], etc.]

---
[List of ONLY the sources you actually cited, formatted as:
[1] Source Title
[2] Source Title]

Example:
Ashwagandha has been shown to reduce stress levels [1] and improve sleep quality [2]. This herb is particularly effective for managing anxiety [1].

---
[1] The Benefits of Ashwagandha
[2] Sleep and Ayurvedic Herbs`
  :
  `I've searched our blog posts but couldn't find specific information about "${message}". Please let the user know we don't currently have content covering this topic in our blog posts.`}

Question: ${message}

Provide a detailed answer:`;

    const result = await llmModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response to separate content and references
    const [content, referencesSection] = text.split('\n---\n');
    
    // Parse used citations from the references section
    const usedReferences = referencesSection
      ? referencesSection.split('\n')
          .filter(line => line.trim())
          .map(line => {
            const match = line.match(/\[(\d+)\]\s+(.+)/);
            return match ? { index: parseInt(match[1]), title: match[2].trim() } : null;
          })
          .filter((ref): ref is { index: number, title: string } => ref !== null)
      : [];

    // Build citations array from used references
    const citations = usedReferences.reduce<Citation[]>((acc, ref) => {
      const source = relevantContent.find((item: FormattedBlogResult) => item.title === ref.title);
      if (source) {
        acc.push({
          title: source.title,
          content: source.content,
          blogId: source.id
        });
      }
      return acc;
    }, []);

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