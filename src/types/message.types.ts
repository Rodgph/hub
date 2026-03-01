export type MessageStatus = 'sending' | 'sent' | 'read' | 'failed';

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface MessageEdit {
  content: string;
  edited_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  status: MessageStatus;
  reactions: MessageReaction[];
  edits: MessageEdit[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
