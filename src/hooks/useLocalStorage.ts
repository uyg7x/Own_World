import { useState, useEffect, useCallback } from 'react';
import type { UserPreferences } from '../types';
import { defaultPreferences } from '../types';

const STORAGE_KEY = 'emotional_wellness_preferences';

interface UseLocalStorageResult {
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  isLoaded: boolean;
}

export function useLocalStorage(): UseLocalStorageResult {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load preferences from localStorage:', err);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever preferences change
  const savePreferences = useCallback((prefs: UserPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (err) {
      console.error('Failed to save preferences to localStorage:', err);
    }
  }, []);

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...updates };
      savePreferences(updated);
      return updated;
    });
  }, [savePreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    savePreferences(defaultPreferences);
  }, [savePreferences]);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoaded,
  };
}

// Separate hook for message history
const MESSAGES_KEY = 'emotional_wellness_messages';

interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isAutoComfort?: boolean;
}

interface UseMessageHistoryResult {
  messages: StoredMessage[];
  addMessage: (message: Omit<StoredMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

export function useMessageHistory(): UseMessageHistoryResult {
  const [messages, setMessages] = useState<StoredMessage[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MESSAGES_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load messages from localStorage:', err);
    }
  }, []);

  const addMessage = useCallback((message: Omit<StoredMessage, 'id' | 'timestamp'>) => {
    const newMessage: StoredMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage].slice(-100); // Keep last 100 messages
      try {
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save messages to localStorage:', err);
      }
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(MESSAGES_KEY);
    } catch (err) {
      console.error('Failed to clear messages from localStorage:', err);
    }
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
}

// Separate hook for cooldown state
const COOLDOWN_KEY = 'emotional_wellness_cooldown';

interface UseCooldownResult {
  lastComfortTime: number | null;
  isOnCooldown: boolean;
  remainingSeconds: number;
  updateCooldown: () => void;
}

export function useCooldown(cooldownSeconds: number = 35): UseCooldownResult {
  const [lastComfortTime, setLastComfortTime] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOLDOWN_KEY);
      if (stored) {
        setLastComfortTime(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load cooldown from localStorage:', err);
    }
  }, []);

  const updateCooldown = useCallback(() => {
    const now = Date.now();
    setLastComfortTime(now);
    try {
      localStorage.setItem(COOLDOWN_KEY, JSON.stringify(now));
    } catch (err) {
      console.error('Failed to save cooldown to localStorage:', err);
    }
  }, []);

  const now = Date.now();
  const elapsed = lastComfortTime ? (now - lastComfortTime) / 1000 : Infinity;
  const remainingSeconds = Math.max(0, cooldownSeconds - elapsed);
  const isOnCooldown = elapsed < cooldownSeconds;

  return {
    lastComfortTime,
    isOnCooldown,
    remainingSeconds: Math.ceil(remainingSeconds),
    updateCooldown,
  };
}
