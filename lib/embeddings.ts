import { GoogleGenerativeAI } from "@google/generative-ai";

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 500;
const MAX_CHUNK_SIZE = 9000; // Slightly less than API limit for safety

const GENERATIVE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GENERATIVE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(GENERATIVE_AI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "models/embedding-001" });

// Improved sanitization function that better handles HTML content
function sanitizeContent(text: string): string {
  // First convert common HTML elements to text with spacing
  const withSpacing = text
    .replace(/<\/p>/g, '\n\n')     // Paragraphs become double newlines
    .replace(/<br\s*\/?>/g, '\n')  // Line breaks become newlines
    .replace(/<li>/g, '• ')        // List items become bullet points
    .replace(/<\/li>/g, '\n')      // End of list items get newline
    .replace(/<\/h[1-6]>/g, '\n\n') // Headers get double newline after
    
  // Then remove all remaining HTML tags
  const noTags = withSpacing.replace(/<[^>]*>/g, '')
  
  // Clean up whitespace while preserving paragraph breaks
  return noTags
    .replace(/\n\s*\n/g, '\n\n')  // Normalize multiple newlines to double
    .replace(/[ \t]+/g, ' ')      // Normalize horizontal whitespace
    .trim()
}

// Split text into smaller chunks with overlap
function generateChunks(text: string): string[] {
  if (text.length <= CHUNK_SIZE) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Calculate chunk boundaries
    const endIndex = Math.min(startIndex + CHUNK_SIZE, text.length);
    let chunk = text.slice(startIndex, endIndex);

    // Adjust chunk to end at a sentence or paragraph boundary if possible
    const boundaries = ['. ', '! ', '? ', '\n'];
    let adjustedEndIndex = endIndex;
    for (const boundary of boundaries) {
      const lastBoundary = chunk.lastIndexOf(boundary);
      if (lastBoundary > CHUNK_SIZE - CHUNK_OVERLAP) {
        adjustedEndIndex = startIndex + lastBoundary + boundary.length;
        chunk = text.slice(startIndex, adjustedEndIndex);
        break;
      }
    }

    if (chunk.length > MAX_CHUNK_SIZE) {
      console.warn(`Chunk exceeds max size, truncating: ${chunk.length} > ${MAX_CHUNK_SIZE}`);
      chunk = chunk.slice(0, MAX_CHUNK_SIZE);
      adjustedEndIndex = startIndex + MAX_CHUNK_SIZE;
    }

    chunks.push(chunk);
    startIndex = adjustedEndIndex - CHUNK_OVERLAP;

    if (text.length - startIndex <= CHUNK_OVERLAP) {
      if (text.length - startIndex > 0) {
        const finalChunk = text.slice(startIndex);
        if (finalChunk.length <= MAX_CHUNK_SIZE) {
          chunks.push(finalChunk);
        }
      }
      break;
    }
  }

  console.log("Generated chunks:", {
    count: chunks.length,
    sizes: chunks.map(c => c.length),
    totalContent: text.length
  });

  return chunks;
}

// Export generateEmbedding for use in chat routes
export async function generateEmbedding(content: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(content);
    if (!result?.embedding?.values) {
      throw new Error("Failed to generate valid embedding");
    }
    return Array.from(result.embedding.values);
  } catch (error) {
    console.error("Embedding generation error:", {
      error: error instanceof Error ? error.message : error,
      contentLength: content.length,
      preview: content.slice(0, 100) + "..."
    });
    throw error;
  }
}

export async function generateEmbeddingsForChunks(chunks: string[]): Promise<number[]> {
  console.log(`Generating embeddings for ${chunks.length} chunks`);

  // Simply concatenate chunks with spaces instead of using separators
  const combinedText = chunks.join(' ');
  console.log(`Combined text length: ${combinedText.length}`);

  try {
    const embedding = await generateEmbedding(combinedText);
    console.log(`Generated single embedding vector`);
    return embedding;
  } catch (error) {
    console.error(`Failed to generate embedding:`, error);
    throw error;
  }
}

export async function prepareBlogForEmbedding(title: string, description: string): Promise<string[]> {
  console.log("Preparing blog for embedding:", { titleLength: title.length, descriptionLength: description.length });

  // Clean and prepare content
  const cleanDescription = sanitizeContent(description);
  const keywords = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .join(', ');

  // Create metadata section that will be included in first chunk
  const metadata = `Title: ${title}\nKeywords: ${keywords}\n`;
  console.log("Metadata section length:", metadata.length);

  // Generate content chunks
  const descriptionChunks = generateChunks(cleanDescription);

  // Add metadata to first chunk
  const finalChunks = descriptionChunks.map((chunk, index) => 
    index === 0 ? `${metadata}${chunk}` : chunk
  );

  // Verify chunk sizes
  const oversizedChunks = finalChunks.filter(chunk => chunk.length > MAX_CHUNK_SIZE);
  if (oversizedChunks.length > 0) {
    throw new Error(`Found ${oversizedChunks.length} chunks exceeding size limit`);
  }

  return finalChunks;
}