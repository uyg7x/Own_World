import { useState, useRef, useCallback, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import type { Mood, MoodDetectionResult } from '../types';

// Load face-api models
const MODEL_URL = '/models';

export function useFaceDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentMood, setCurrentMood] = useState<MoodDetectionResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Load models on mount
  useEffect(() => {
    async function loadModels() {
      try {
        setIsLoading(true);
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setError('Failed to load face detection models');
        setIsLoading(false);
      }
    }
    loadModels();
  }, []);

  // Map face-api expressions to our moods
  const mapExpressions = useCallback((expressions: Record<string, number>): MoodDetectionResult => {
    // face-api expressions object with probabilities
    const scoresObj: Record<string, number> = { ...expressions };

    // Map face-api expressions to our 5 moods
    let mood: Mood = 'neutral';
    const threshold = 0.5;

    if (scoresObj.happy && scoresObj.happy > threshold && scoresObj.happy > (scoresObj.neutral || 0)) {
      mood = 'happy';
    } else if (scoresObj.sad && scoresObj.sad > threshold) {
      mood = 'sad';
    } else if (scoresObj.angry && scoresObj.angry > threshold) {
      mood = 'angry';
    } else if ((scoresObj.disgusted && scoresObj.disgusted > threshold) || (scoresObj.fearful && scoresObj.fearful > threshold)) {
      mood = 'angry'; // Map to angry
    } else if (scoresObj.neutral && scoresObj.neutral > 0.7) {
      mood = 'neutral';
    } else {
      mood = 'bored'; // Default to bored when no strong emotion
    }

    const maxProb = Math.max(...Object.values(scoresObj));
    return {
      mood,
      confidence: maxProb,
      expression: mood,
    };
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      // First check if we already have permission
      const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (permissions.state === 'denied') {
        setError('Camera access denied. Please allow camera access in your browser settings.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Camera access denied. Please allow camera access.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsCameraActive(false);
  }, []);

  // Detect faces in video
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const displaySize = { width: video.videoWidth, height: video.videoHeight };

    faceapi.matchDimensions(canvas, displaySize);

    async function detect() {
      if (!videoRef.current || !canvasRef.current) return;

      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, detections);

        // Update mood from first face detected
        if (detections.length > 0) {
          const detection = detections[0];
          // Access expressions as an object with expression names as keys
          const expressions: Record<string, number> = {
            neutral: (detection.expressions as any).neutral || 0,
            happy: (detection.expressions as any).happy || 0,
            sad: (detection.expressions as any).sad || 0,
            angry: (detection.expressions as any).angry || 0,
            fearful: (detection.expressions as any).fearful || 0,
            disgusted: (detection.expressions as any).disgusted || 0,
            surprised: (detection.expressions as any).surprised || 0,
          };
          const moodResult = mapExpressions(expressions);
          setCurrentMood(moodResult);
        }
      }

      animationRef.current = requestAnimationFrame(detect);
    }

    detect();
  }, [isCameraActive, mapExpressions]);

  // Start face detection loop
  const startDetection = useCallback(() => {
    if (isCameraActive) {
      detectFaces();
    }
  }, [isCameraActive, detectFaces]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isLoading,
    error,
    isCameraActive,
    currentMood,
    startCamera,
    stopCamera,
    toggleCamera,
    startDetection,
  };
}

// Mood emoji mapping
export function getMoodEmoji(mood: Mood): string {
  const emojis: Record<Mood, string> = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    bored: '😴',
    neutral: '😐',
  };
  return emojis[mood];
}

// Mood color mapping
export function getMoodColor(mood: Mood): string {
  const colors: Record<Mood, string> = {
    happy: '#4CAF50',    // Green
    sad: '#2196F3',      // Blue
    angry: '#F44336',     // Red
    bored: '#9E9E9E',    // Gray
    neutral: '#607D8B',  // Blue Gray
  };
  return colors[mood];
}
