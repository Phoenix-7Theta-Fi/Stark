import { NextResponse } from "next/server";
import { Db, ObjectId } from "mongodb";
import OpenAI from "openai";
import { ChatOpenAI } from "@langchain/openai";
import clientPromise from "@/lib/mongodb";
import { generateEmbedding } from "@/lib/embeddings";
import { Citation, BlogCitation, WebCitation, ChatResponse } from "@/types/chat";
import { createSearchOrchestrator } from "@/lib/search/orchestrator";

const GLAMA_API_KEY = process.env.GLAMA_API_KEY;
if (!GLAMA_API_KEY) {
  throw new Error("GLAMA_API_KEY is not configured");
}

// OpenAI instance for embeddings
const openai = new OpenAI({
  baseURL: 'https://glama.ai/api/gateway/openai/v1',
  apiKey: GLAMA_API_KEY,
});

// ChatOpenAI instance for LangChain
const llm = new ChatOpenAI({
  modelName: "gemini-2.0-flash-exp",
  openAIApiKey: GLAMA_API_KEY,
  configuration: {
    baseURL: 'https://glama.ai/api/gateway/openai/v1',
  }
});

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

    const results = await db.collection("blogs").aggregate<BlogResult>(pipeline).toArray();
    
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

function extractCitations(text: string, blogContent: FormattedBlogResult[]): Citation[] {
  const citations: Citation[] = [];
  const seen = new Set<string>();

  // Get the references section
  const [mainContent, referencesSection] = text.split('References:');
  if (!referencesSection) {
    return citations;
  }

  // Extract references with their numbers and URLs
  const references = referencesSection.split('\n').filter(line => line.trim());
  
  references.forEach(ref => {
    // Match [number] Title - URL format
    const urlMatch = ref.match(/\[(\d+)\]\s+(.+?)\s*-\s*(https?:\/\/[^\s]+)/);
    // Match [number] Title format (for blogs)
    const blogMatch = ref.match(/\[(\d+)\]\s+(.+?)$/);

    if (urlMatch) {
      const [_, num, title, url] = urlMatch;
      if (!seen.has(url)) {
        seen.add(url);
        const citation: WebCitation = {
          title: title.trim(),
          content: `Source: ${title.trim()}\nURL: ${url}`,
          type: 'web',
          url: url
        };
        citations.push(citation);
      }
    } else if (blogMatch) {
      const [_, num, title] = blogMatch;
      const index = parseInt(num) - 1;
      const blogItem = blogContent[index];
      if (blogItem?.id && !seen.has(blogItem.id)) {
        seen.add(blogItem.id);
        if (ObjectId.isValid(blogItem.id.trim())) {
          const citation: BlogCitation = {
            title: blogItem.title,
            content: blogItem.content,
            blogId: blogItem.id.trim(),
            type: 'blog'
          };
          citations.push(citation);
        }
      }
    }
  });

  return citations;
}

export async function POST(req: Request) {
  const client = await clientPromise;
  const db = client.db("tweb");
  
  try {
    const { message, previousQuestions = [] } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("Processing query:", message);

    // Get blog results
    const enhancedQuery = `
Title: Find information about ${message}
Keywords: ${message.toLowerCase().split(/\s+/).join(', ')}
Description: Find detailed information about ${message}
This article discusses: ${message}
Key concepts covered: ${message.toLowerCase()}
Full content: Tell me about ${message}`;

    const queryEmbedding = await generateEmbedding(enhancedQuery);
    const relevantBlogs = await getBlogEmbeddings(db, queryEmbedding);

    const relevantContent: FormattedBlogResult[] = relevantBlogs.map((content: string) => {
      const titleMatch = content.match(/Title: (.*?)(?:\n|$)/);
      const idMatch = content.match(/ID: (.*?)(?:\n|$)/);
      const contentMatch = content.match(/Full content: (.*?)(?:\n|$)/);

      return {
        id: idMatch ? idMatch[1].trim() : '',
        title: titleMatch ? titleMatch[1].trim() : '',
        content: contentMatch ? contentMatch[1].trim() : content.trim()
      };
    });

    // Create search orchestrator
    const searchOrchestrator = await createSearchOrchestrator(llm);
    const { answer, suggestions } = await searchOrchestrator(
      message,
      relevantContent.map(item => item.content),
      previousQuestions
    );

    // Extract citations and references
    const citations = extractCitations(answer, relevantContent);

    // Split content and references, preserving the references formatting
    const [mainContent, referencesSection] = answer.split('References:');

    const response: ChatResponse = {
      response: mainContent.trim(),
      citations: citations,
      references: referencesSection ? 'References:' + referencesSection : null,
      suggestions: suggestions
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Chat API error:", error);
    
    let errorMessage = "Failed to generate response";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("embedContent")) {
        errorMessage = "Error generating embeddings for the query";
      } else if (error.message.includes("AI Response Generation Failed")) {
        errorMessage = error.message;
      }
      console.error("Error details:", error.message);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}