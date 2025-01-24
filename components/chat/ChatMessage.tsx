import type { ChatMessage as ChatMessageType, Citation } from "@/types/chat";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface ChatMessageProps {
  message: ChatMessageType;
  onSuggestionClick?: (question: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-4 px-6 py-5 rounded-lg",
        message.role === "assistant" 
          ? "bg-[#FDF8ED] border border-[#F3E8D0]" 
          : "bg-[#FBF7EF]"
      )}
    >
      {message.role === "assistant" && (
        <div className="flex-shrink-0">
          <Image
            src="/images/tangerina/avatar.svg"
            alt="Tangerina"
            width={40}
            height={40}
            className="rounded-full bg-white shadow-sm"
          />
        </div>
      )}
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">
            {message.role === "assistant" ? "Tangerina" : "You"}
          </span>
        </div>
        <div className="prose max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 list-disc pl-6 space-y-2">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 list-decimal pl-6 space-y-2">{children}</ol>,
              li: ({ children }) => <li className="text-gray-700">{children}</li>,
              h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold text-gray-900">{children}</h1>,
              h2: ({ children }) => <h2 className="mb-3 text-xl font-bold text-gray-900">{children}</h2>,
              h3: ({ children }) => <h3 className="mb-3 text-lg font-bold text-gray-900">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-700">{children}</blockquote>
              ),
              code: ({ children }) => (
                <code className="rounded bg-[#F3E8D0] px-1.5 py-0.5 font-mono text-sm text-gray-900">{children}</code>
              ),
              pre: ({ children }) => (
                <pre className="mb-4 overflow-x-auto rounded-lg bg-[#F3E8D0] p-4 font-mono text-sm text-gray-900">
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {message.citations && message.citations.length > 0 && (
            <div className="mt-6 border-t border-amber-200/50 pt-4 bg-amber-50/30 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                  📚
                </span>
                Wisdom Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {message.citations.map((citation: Citation, index: number) => (
                  <div key={index} className="inline-flex">
                    {citation.type === 'blog' ? (
                      <Link
                        href={`/blog/${citation.blogId}`}
                        className="group px-4 py-2.5 bg-amber-50 rounded-lg border border-amber-200 shadow-sm 
                                 hover:bg-amber-100 hover:border-amber-300 transition-all duration-200 
                                 text-sm no-underline flex items-center gap-2"
                      >
                        <span className="text-amber-600 font-medium group-hover:text-amber-700">[{index + 1}]</span>
                        <span className="text-amber-900 group-hover:text-amber-950">{citation.title}</span>
                      </Link>
                    ) : (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group px-4 py-2.5 bg-amber-50 rounded-lg border border-amber-200 shadow-sm 
                                 hover:bg-amber-100 hover:border-amber-300 transition-all duration-200 
                                 text-sm no-underline flex items-center gap-2"
                      >
                        <span className="text-amber-600 font-medium group-hover:text-amber-700">[{index + 1}]</span>
                        <span className="text-amber-900 group-hover:text-amber-950">{citation.title}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-6 border-t border-emerald-200/50 pt-4 bg-emerald-50/30 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  🌿
                </span>
                Explore Further
              </p>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="group px-4 py-2.5 bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm 
                             hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 
                             text-sm text-left flex items-center gap-2"
                  >
                    <span className="text-emerald-900 group-hover:text-emerald-950">{suggestion}</span>
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