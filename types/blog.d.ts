import { ObjectId } from "mongodb"

// For database operations
export interface BlogDocument {
  _id: ObjectId
  title: string
  description: string
  author: {
    name: string
    avatar: string
    practitionerId: string  // Now required
  }
  readTime: string
  image?: {
    data: string  // Base64 encoded image data
    type: string  // MIME type
  }
  createdAt?: Date
  embedding: number[]  // Vector embedding for semantic search
}

// For frontend/API responses
export interface Blog {
  _id: string
  title: string
  description: string
  author: {
    name: string
    avatar: string
    practitionerId: string  // Now required
  }
  readTime: string
  image?: {
    data: string
    type: string
  }
  createdAt?: string
  embeddings: {
    text: string,       // The chunk of text this embedding represents
    vector: number[]    // Vector embedding for semantic search
  }[]                  // Array of embeddings for different chunks
}