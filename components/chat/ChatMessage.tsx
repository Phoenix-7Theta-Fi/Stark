import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-2 p-4",
        message.role === "assistant" ? "bg-gray-50" : "bg-white"
      )}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {message.role === "assistant" ? "AI Assistant" : "You"}
          </span>
        </div>
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}