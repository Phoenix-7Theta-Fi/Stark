export interface Citation {
  title: string;
  content: string;
  blogId: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export interface ChatSession {
  messages: ChatMessage[];
  isLoading?: boolean;
}