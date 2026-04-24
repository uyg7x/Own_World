import { useEffect, useRef } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { useFaceDetection, getMoodColor } from '../hooks/useFaceDetection';
import type { Mood } from '../types';

interface CameraPanelProps {
  enabled: boolean;
  onToggle: () => void;
  onMoodChange: (mood: Mood, confidence: number) => void;
  currentMood: Mood;
  moodConfidence: number;
}

export function CameraPanel({
  enabled,
  onToggle,
  onMoodChange,
  currentMood,
  moodConfidence
}: CameraPanelProps) {
  const {
    videoRef,
    canvasRef,
    isLoading,
    error,
    isCameraActive,
    currentMood: detectedMood,
    toggleCamera,
    startDetection
  } = useFaceDetection();

  // Start detection when camera becomes active
  useEffect(() => {
    if (isCameraActive) {
      startDetection();
    }
  }, [isCameraActive, startDetection]);

  // Report mood changes to parent
  useEffect(() => {
    if (detectedMood) {
      onMoodChange(detectedMood.mood, detectedMood.confidence);
    }
  }, [detectedMood, onMoodChange]);

  // Handle toggle
  const handleToggle = async () => {
    if (isCameraActive) {
      await toggleCamera();
      onToggle();
    } else {
      // Only toggle on if camera starts successfully
      const beforeState = isCameraActive;
      await toggleCamera();
      // Only call onToggle if camera actually started
      if (!beforeState && isCameraActive) {
        onToggle();
      }
    }
  };

  return (
    <div className="camera-panel">
      {/* Video Toggle Button */}
      <button
        className={`video-toggle ${enabled ? 'active' : ''}`}
        onClick={handleToggle}
        title={enabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {enabled ? <Video size={20} /> : <VideoOff size={20} />}
        <span>{enabled ? 'ON' : 'OFF'}</span>
      </button>

      {/* Camera View */}
      {enabled ? (
        <div className="camera-view">
          {isLoading ? (
            <div className="camera-loading">
              <div className="loading-spinner"></div>
              <p>Loading face detection models...</p>
            </div>
          ) : error ? (
            <div className="camera-error">
              <p>{error}</p>
              <p className="error-hint">Please allow camera access to use mood detection</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} className="camera-canvas" />

              {/* Mood Overlay */}
              <div className="mood-overlay" style={{ borderColor: getMoodColor(currentMood) }}>
                <div className="mood-indicator">
                  <span className="mood-label">{currentMood}</span>
                  {moodConfidence > 0 && (
                    <span className="mood-bar">
                      <span
                        className="mood-bar-fill"
                        style={{
                          width: `${moodConfidence * 100}%`,
                          backgroundColor: getMoodColor(currentMood)
                        }}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* Face Detection Status */}
              <div className="detection-status">
                {isCameraActive ? (
                  <span className="status-active">Detecting expressions...</span>
                ) : (
                  <span className="status-inactive">Camera inactive</span>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="camera-disabled">
          <VideoOff size={48} />
          <p>Camera is turned off</p>
          <p className="hint">Turn on to enable mood detection</p>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Your face data never leaves your device</span>
      </div>
    </div>
  );
}
