export enum AppMode {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  CALL = 'CALL',
  CHAT = 'CHAT'
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  ttsCode: string; // Text-to-speech locale code
}

export interface UserConfig {
  name: string;
  language: Language;
}

export interface Message {
  id: string;
  senderId: string; // Changed from 'userA' | 'userB' to generic ID
  originalText: string;
  translatedText: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  language: Language;
  avatar?: string;
  status?: string; // Text status
}

export interface Short {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  type: 'image' | 'video';
  caption: string;
  timestamp: number;
  likes: number;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', ttsCode: 'en-US' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', ttsCode: 'hi-IN' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', ttsCode: 'es-ES' },
  { code: 'fr', name: 'French', flag: '🇫🇷', ttsCode: 'fr-FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', ttsCode: 'de-DE' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', ttsCode: 'ja-JP' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳', ttsCode: 'zh-CN' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', ttsCode: 'ru-RU' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', ttsCode: 'ar-SA' },
];
