export type UserStatus = 'online' | 'away' | 'dnd' | 'offline';

export interface UserSettings {
  language: string;
  theme: 'light' | 'dark' | 'custom';
  notifications: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  avatar_alt_url?: string;
  banner_url?: string;
  banner_type?: 'image' | 'video' | 'color' | 'gradient';
  bio?: string;
  status: UserStatus;
  settings: UserSettings;
  created_at: string;
}
