import { Metadata } from "next";
import { ChatPageClient } from "./ChatPageClient";

export const metadata: Metadata = {
  title: "Chat with Tangerina | Your Ayurvedic Guide",
  description: "Connect with Tangerina, your caring Ayurvedic guide to holistic wellness and balanced living",
};

export default function ChatPage() {
  return (
    <main className="container mx-auto p-4">
      <ChatPageClient />
    </main>
  );
}