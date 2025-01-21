import { Metadata } from "next";
import { ChatPageClient } from "./ChatPageClient";

export const metadata: Metadata = {
  title: "AI Chat Assistant",
  description: "Chat with our AI assistant powered by Google Gemini",
};

export default function ChatPage() {
  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
        <p className="text-gray-600">Chat with our AI assistant powered by Google Gemini</p>
      </div>
      <ChatPageClient />
    </main>
  );
}