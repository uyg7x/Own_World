// Type definitions for the Emotional Wellness Companion

export type Mood = 'happy' | 'sad' | 'angry' | 'bored' | 'neutral';

export type Language = 'hi' | 'en' | 'ta' | 'pa' | 'bn';

export type Persona = 'friend' | 'family' | 'wise';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAutoComfort?: boolean;
  mood?: Mood;
}

export interface UserPreferences {
  userId: string;
  name?: string;
  likes: string[];
  dislikes: string[];
  language: Language;
  persona: Persona;
  autoComfort: boolean;
  voiceOutput: boolean;
  clonedVoiceId?: string;
  currentMood?: Mood;
  moodConfidence?: number;
}

export interface MoodDetectionResult {
  mood: Mood;
  confidence: number;
  expression: string;
}

export interface ChatResponse {
  response: string;
  mood_used?: Mood;
  language: Language;
}

export interface AutoComfortResponse {
  response: string;
  triggered_by: string;
  mood_detected: Mood;
  tag: string;
}

export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

// Default preferences
export const defaultPreferences: UserPreferences = {
  userId: 'default',
  likes: [],
  dislikes: [],
  language: 'hi',
  persona: 'friend',
  autoComfort: true,
  voiceOutput: true,
};
