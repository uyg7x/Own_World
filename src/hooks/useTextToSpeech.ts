import { useState, useRef, useCallback, useEffect } from 'react';
import { textToSpeech } from '../services/api';

interface UseTextToSpeechResult {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  speak: (text: string, voiceId?: string) => Promise<void>;
  stop: () => void;
}

// Create audio context lazily to handle autoplay policy
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function useTextToSpeech(): UseTextToSpeechResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string, voiceId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Generate audio from backend
      const audioBlob = await textToSpeech(text, voiceId);
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Handle autoplay policy - resume context if suspended
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError('Audio playback failed');
        setIsLoading(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speech synthesis failed');
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    speak,
    stop,
  };
}

// Utility to preload TTS (call early to warm up)
export async function preloadTTS(): Promise<boolean> {
  try {
    const blob = await textToSpeech('testing');
    // Just checking if the API is working
    return true;
  } catch {
    return false;
  }
}
