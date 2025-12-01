export interface Message {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: number;
}
