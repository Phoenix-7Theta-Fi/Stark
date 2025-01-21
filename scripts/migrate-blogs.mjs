import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load env vars from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
dotenv.config({ path: join(rootDir, '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

if (!GOOGLE_AI_API_KEY) {
  throw new Error('Please define the GOOGLE_AI_API_KEY environment variable inside .env.local');
}

const client = new MongoClient(MONGODB_URI);
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "models/embedding-001" });

async function prepareBlogForEmbedding(title, description) {
  const cleanDescription = description.replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

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

async function generateEmbedding(content) {
  try {
    const result = await embeddingModel.embedContent(content);
    return Array.from(result.embedding.values);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    const db = client.db("tweb");

    // Get all blogs
    const blogsCollection = db.collection("blogs");
    const blogs = await blogsCollection.find({}).toArray();
    
    console.log(`Found ${blogs.length} blogs to process`);
    
    for (const blog of blogs) {
      try {
        console.log(`Processing: ${blog.title}`);
        
        // Prepare content and generate embedding
        const content = await prepareBlogForEmbedding(blog.title, blog.description);
        const embedding = await generateEmbedding(content);

        // Update blog with embedding
        await blogsCollection.updateOne(
          { _id: blog._id },
          { $set: { embedding } }
        );

        console.log(`✓ Added embedding for: ${blog.title}`);
      } catch (error) {
        console.error(`Error processing blog ${blog.title}:`, error);
      }
    }

    // Verify results
    const blogsWithEmbeddings = await blogsCollection.countDocuments({ embedding: { $exists: true } });
    console.log(`\nMigration complete. ${blogsWithEmbeddings} blogs now have embeddings.`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
    process.exit();
  }
}

main();