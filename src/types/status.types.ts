export type PresenceStatus = 'online' | 'away' | 'dnd' | 'offline';

export type ActivityType = 'playing' | 'listening' | 'watching' | 'streaming' | 'competing';

export interface ActivityStatus {
  type: ActivityType;
  name: string;
  details?: string;
  state?: string;
  start_time?: number;
  assets?: {
    large_image?: string;
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
}
