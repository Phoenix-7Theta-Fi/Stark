export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  messages: ChatMessage[];
  isLoading?: boolean;
}