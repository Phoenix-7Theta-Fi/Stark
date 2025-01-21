import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const EMBEDDING_MODEL_NAME = "models/embedding-001";

const genAI = new GoogleGenerativeAI(GENERATIVE_AI_API_KEY || "");
const embeddingModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

export interface EmbeddingDocument {
  blogId: string;
  content: string;
  embedding: number[];
}

export async function generateEmbedding(content: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(content);
    return Array.from(result.embedding.values);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

export async function prepareBlogForEmbedding(title: string, description: string) {
  // Clean up HTML tags and format content for better context
  const cleanDescription = description.replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Add semantic markers to help with matching
  const keywords = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .join(', ');

  return `Title: ${title}
Keywords: ${keywords}
Description: ${cleanDescription}

This article discusses: ${title}
Key concepts covered: ${keywords}
Full content: ${cleanDescription}`;
}