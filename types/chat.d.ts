export interface BaseCitation {
  title: string;
  content: string;
  type: 'blog' | 'web';
}

export interface BlogCitation extends BaseCitation {
  type: 'blog';
  blogId: string;
}

export interface WebCitation extends BaseCitation {
  type: 'web';
  url: string;
}

// Make Citation type explicitly a union of both citation types
export type Citation = BlogCitation | WebCitation;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  suggestions?: string[]; // Array of suggested follow-up questions
}

export interface ChatSession {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export interface ChatResponse {
  response: string;
  citations: Citation[];
  references: string | null;
  suggestions: string[]; // Array of 3 suggested follow-up questions
}