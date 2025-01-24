"use client";

import { useState, useEffect } from "react";
import type { ChatMessage, ChatSession } from "@/types/chat";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const exploreTopics = [
  "Tell me about Ayurvedic principles for daily wellness",
  "What are common health issues that Ayurveda can address?",
  "How does Ayurveda view mental health?",
  "What are the three doshas in Ayurveda?",
  "How can Ayurveda help with digestive health?",
  "What are some Ayurvedic remedies for stress?",
];

const thinkingMessages = [
  "Let me reflect on this with ancient wisdom...",
  "Drawing from Ayurvedic knowledge to help you...",
  "Carefully considering the best guidance for you...",
  "Connecting with traditional healing wisdom...",
  "Taking a mindful moment to provide thorough guidance...",
  "Weaving together holistic insights for you...",
];

export function ChatPageClient() {
  const [chatSession, setChatSession] = useState<ChatSession>({
    messages: [],
    isLoading: false,
  });
  const [input, setInput] = useState("");
  const [thinkingMessage, setThinkingMessage] = useState(thinkingMessages[0]);
  const { toast } = useToast();

  useEffect(() => {
    if (chatSession.isLoading) {
      const interval = setInterval(() => {
        setThinkingMessage(prev => {
          const currentIndex = thinkingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % thinkingMessages.length;
          return thinkingMessages[nextIndex];
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [chatSession.isLoading]);

  const handleSuggestionClick = async (question: string) => {
    await sendMessage(null, question);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !chatSession.isLoading) {
        sendMessage(e as any);
      }
    }
  };

  async function sendMessage(e: React.FormEvent<HTMLFormElement> | null, directMessage?: string) {
    if (e) e.preventDefault();
    
    const messageToSend = directMessage || input;
    if (!messageToSend.trim() || chatSession.isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: messageToSend.trim(),
    };

    setChatSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));
    setInput("");

    try {
      const previousQuestions = chatSession.messages
        .filter(msg => msg.role === "user")
        .map(msg => msg.content);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          previousQuestions 
        }),
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
            citations: data.citations,
            suggestions: data.suggestions
          },
        ],
        isLoading: false,
      }));
    } catch (error) {
      toast({
        title: "Connection Issue",
        description: "I'm having trouble connecting. Please try again in a moment.",
        variant: "destructive",
      });
      setChatSession((prev) => ({ ...prev, isLoading: false }));
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border border-emerald-300">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatSession.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="flex items-center gap-4 mb-8">
              <div className="relative">
                <Image
                  src="/images/tangerina/avatar.svg"
                  alt="Tangerina"
                  width={80}
                  height={80}
                  className="rounded-full bg-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center">
                  🌿
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-emerald-900">Namaste! I'm Tangerina</h2>
                <p className="text-emerald-700">Your caring Ayurvedic guide to holistic wellness</p>
              </div>
            </div>
            <div className="w-full max-w-2xl bg-emerald-100/50 rounded-lg p-6 border border-emerald-300 shadow-sm">
              <p className="text-base font-medium text-emerald-900 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center">
                  💡
                </span>
                Begin Your Wellness Journey
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exploreTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(topic)}
                    className="group p-4 bg-white rounded-lg border-2 border-emerald-200 shadow-sm 
                             hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 
                             text-left text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    <span className="text-emerald-800 group-hover:text-emerald-900">{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatSession.messages.map((message, i) => (
              <ChatMessageComponent 
                key={i} 
                message={message} 
                onSuggestionClick={handleSuggestionClick}
              />
            ))}
          </>
        )}
        {chatSession.isLoading && (
          <div className="flex items-center justify-center gap-4 p-6 bg-emerald-50/30 rounded-lg border border-emerald-200">
            <div className="relative">
              <Image
                src="/images/tangerina/avatar.svg"
                alt="Tangerina thinking"
                width={50}
                height={50}
                className="rounded-full bg-white shadow-sm animate-pulse"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center animate-bounce">
                🤔
              </div>
            </div>
            <p className="text-emerald-800 font-medium">{thinkingMessage}</p>
          </div>
        )}
      </div>
      
      <div className="border-t border-emerald-300">
        <form onSubmit={sendMessage} className="p-4">
          <div className="flex gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about Ayurvedic wellness... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 border-emerald-300 focus:ring-emerald-300 focus:border-emerald-400"
              rows={2}
            />
            <Button 
              type="submit" 
              disabled={chatSession.isLoading || !input.trim()}
              className="self-end bg-emerald-700 hover:bg-emerald-800"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}