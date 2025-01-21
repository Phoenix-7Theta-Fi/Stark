import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Create a model instance with the specific model name
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GOOGLE_AI_API_KEY) {
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

    // Generate content using the model
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}