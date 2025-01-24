import type { ChatMessage as ChatMessageType, Citation } from "@/types/chat";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (question: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
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
                {message.citations.map((citation: Citation, index: number) => (
                  <li key={index} className="text-sm text-gray-600">
                    [{index + 1}]{" "}
                    {citation.type === 'blog' ? (
                      <Link
                        href={`/blog/${citation.blogId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {citation.title}
                      </Link>
                    ) : (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {citation.title}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-semibold text-gray-600">Follow-up Questions:</p>
              <div className="mt-2 flex flex-col gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors duration-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}