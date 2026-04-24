// API service for communicating with the backend
import type {
  ChatResponse,
  AutoComfortResponse,
  UserPreferences,
  Mood,
  Language,
  Persona,
  Voice,
  MoodDetectionResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Chat API
export async function sendChatMessage(
  message: string,
  userId: string,
  language: Language,
  persona: Persona,
  mood?: Mood,
  preferences?: Partial<UserPreferences>
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      user_id: userId,
      language,
      persona,
      mood,
      preferences,
    }),
  });
}

// Auto-Comfort API
export async function triggerAutoComfort(
  userId: string,
  language: Language,
  persona: Persona,
  mood: Mood
): Promise<AutoComfortResponse> {
  return apiFetch<AutoComfortResponse>('/auto-comfort', {
    method: 'POST',
    body: JSON.stringify({
      message: `User is feeling ${mood}. Comfort them with a short message.`,
      user_id: userId,
      language,
      persona,
      mood,
    }),
  });
}

// Mood Update API
export async function updateMood(
  userId: string,
  mood: Mood,
  confidence: number
): Promise<{ status: string; mood: string }> {
  return apiFetch('/update-mood', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, mood, confidence }),
  });
}

// Preferences API
export async function updatePreferences(
  userId: string,
  preferences: Partial<Pick<UserPreferences, 'likes' | 'dislikes' | 'name'>>
): Promise<{ status: string; preferences: UserPreferences }> {
  return apiFetch('/update-preferences', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, ...preferences }),
  });
}

export async function getPreferences(userId: string): Promise<{ preferences: UserPreferences }> {
  return apiFetch(`/get-preferences/${userId}`);
}

// Voice API
export async function getVoices(): Promise<{ voices: Voice[] }> {
  return apiFetch('/get-voices');
}

export async function cloneVoice(
  userId: string,
  name: string,
  audioFile: File
): Promise<{ status: string; voice_id: string; voice_name: string }> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await fetch(`${API_BASE}/clone-voice?user_id=${userId}&name=${name}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Voice cloning failed');
  }

  return response.json();
}

// TTS API - Returns audio blob
export async function textToSpeech(
  text: string,
  voiceId: string = 'eleven_monolingual_v1'
): Promise<Blob> {
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    body: JSON.stringify({ text, voice_id: voiceId }),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('TTS generation failed');
  }

  return response.blob();
}

// Cooldown Status
export async function getCooldownStatus(
  userId: string
): Promise<{ on_cooldown: boolean; remaining_seconds: number }> {
  return apiFetch(`/cooldown-status/${userId}`);
}

// Health Check
export async function healthCheck(): Promise<{
  status: string;
  groq_connected: boolean;
  elevenlabs_connected: boolean;
}> {
  return apiFetch('/health');
}

// Mock mood detection for demo (in production, use face-api.js results)
export function detectMoodFromExpression(expressions: Record<string, number>): MoodDetectionResult {
  const weights = {
    angry: expressions.angry || 0,
    sad: expressions.sad || 0,
    bored: expressions.bored || 0,
    happy: expressions.happy || 0,
    neutral: expressions.neutral || 0.5,
  };

  const maxKey = Object.entries(weights).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0] as Mood;

  return {
    mood: maxKey,
    confidence: weights[maxKey],
    expression: maxKey,
  };
}
