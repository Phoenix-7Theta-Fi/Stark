import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
          {message.citations && message.citations.length > 0 && (
            <div className="mt-4 border-t pt-2">
              <p className="text-sm font-semibold text-gray-600">References:</p>
              <ul className="mt-2 list-none space-y-2 pl-0">
                {message.citations.map((citation, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    [{index + 1}]{" "}
                    {citation.blogId ? (
                      <Link
                        href={`/blog/${citation.blogId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {citation.title}
                      </Link>
                    ) : (
                      citation.title
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}