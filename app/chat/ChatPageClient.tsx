"use client";

import { useState } from "react";
import type { ChatMessage, ChatSession } from "@/types/chat";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export function ChatPageClient() {
  const [chatSession, setChatSession] = useState<ChatSession>({
    messages: [],
    isLoading: false,
  });
  const [input, setInput] = useState("");
  const { toast } = useToast();

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || chatSession.isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setChatSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      setChatSession((prev) => ({
        messages: [
          ...prev.messages,
          { 
            role: "assistant", 
            content: data.response,
            citations: data.citations 
          },
        ],
        isLoading: false,
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive",
      });
      setChatSession((prev) => ({ ...prev, isLoading: false }));
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatSession.messages.map((message, i) => (
          <ChatMessageComponent key={i} message={message} />
        ))}
        {chatSession.isLoading && (
          <div className="flex items-center justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="border-t p-4">
        <div className="flex gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            rows={2}
          />
          <Button 
            type="submit" 
            disabled={chatSession.isLoading || !input.trim()}
            className="self-end"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}