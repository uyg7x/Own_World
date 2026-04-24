import { useState, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Upload, Smile, Settings, X, Video, VideoOff, Plus, Trash2 } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel';
import { CameraPanel } from './components/CameraPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useLocalStorage, useMessageHistory, useCooldown } from './hooks/useLocalStorage';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { sendChatMessage, triggerAutoComfort, updateMood, getCooldownStatus } from './services/api';
import type { Mood, Message, UserPreferences } from './types';
import './App.css';

function App() {
  const { preferences, updatePreferences, isLoaded } = useLocalStorage();
  const { messages, addMessage, clearMessages } = useMessageHistory();
  const { lastComfortTime, isOnCooldown, remainingSeconds, updateCooldown } = useCooldown();
  const { transcript, interimTranscript, isListening, isSupported: speechSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, isPlaying: isSpeaking } = useTextToSpeech();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMood, setCurrentMood] = useState<Mood>('neutral');
  const [moodConfidence, setMoodConfidence] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status
  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/health`);
        setIsConnected(response.ok);
      } catch {
        setIsConnected(false);
      }
    }
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Send message to API
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isTyping) return;

    // Add to history before clearing (for new chat detection)
    if (messages.length === 0) {
      // This is a new conversation
    }

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    // Add user message to history
    addMessage({ role: 'user', content: userMessage });

    try {
      const response = await sendChatMessage(
        userMessage,
        preferences.userId,
        preferences.language,
        preferences.persona,
        currentMood,
        { likes: preferences.likes, dislikes: preferences.dislikes }
      );

      // Add AI response
      addMessage({ role: 'assistant', content: response.response });

      // Speak if voice output is enabled
      if (preferences.voiceOutput && preferences.clonedVoiceId) {
        await speak(response.response, preferences.clonedVoiceId);
      } else if (preferences.voiceOutput) {
        await speak(response.response);
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Arrey yaar, kuch technical problem ho gaya. Thoda der baad try kar! 😅'
      });
    } finally {
      setIsTyping(false);
    }
  }, [inputMessage, isTyping, preferences, currentMood, addMessage, speak]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
      // When stopped, transcript should be ready
      if (transcript) {
        setInputMessage(transcript);
        resetTranscript();
      }
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, transcript, resetTranscript, startListening, stopListening]);

  // Handle auto-comfort trigger
  const handleAutoComfort = useCallback(async (mood: Mood) => {
    if (!preferences.autoComfort || isOnCooldown || isTyping) return;

    try {
      // Check cooldown from server
      const cooldownStatus = await getCooldownStatus(preferences.userId);
      if (cooldownStatus.on_cooldown) {
        return;
      }

      const response = await triggerAutoComfort(
        preferences.userId,
        preferences.language,
        preferences.persona,
        mood
      );

      // Add auto-comfort message
      addMessage({
        role: 'assistant',
        content: response.response,
        isAutoComfort: true
      });

      // Update cooldown
      updateCooldown();

      // Speak if enabled
      if (preferences.voiceOutput) {
        await speak(response.response);
      }
    } catch (error) {
      console.error('Auto-comfort error:', error);
    }
  }, [preferences, isOnCooldown, isTyping, addMessage, updateCooldown, speak]);

  // Handle mood change from camera
  const handleMoodChange = useCallback(async (mood: Mood, confidence: number) => {
    setCurrentMood(mood);
    setMoodConfidence(confidence);

    // Update mood on server
    try {
      await updateMood(preferences.userId, mood, confidence);
    } catch (error) {
      console.error('Mood update error:', error);
    }

    // Auto-comfort trigger for bad moods
    if (['angry', 'sad', 'bored'].includes(mood) && confidence > 0.5) {
      handleAutoComfort(mood);
    }
  }, [preferences.userId, handleAutoComfort]);

  // Keyboard shortcut for send
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Convert stored messages to Message type
  const convertedMessages: Message[] = messages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    timestamp: new Date(m.timestamp),
    isAutoComfort: m.isAutoComfort
  }));

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your wellness companion...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Left Panel - 30% */}
      <div className="left-panel">
        <div className="left-panel-content">
          {/* Header */}
          <div className="panel-header">
            <div className="logo">
              <Smile className="heart-icon" />
              <span>PJY SelfCare</span>
            </div>
            <div className="header-actions">
              <button
                className="icon-btn"
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button
                className="icon-btn"
                onClick={clearMessages}
                title="Clear Chat"
              >
                <Trash2 size={20} />
              </button>
              <button
                className="icon-btn"
                onClick={() => clearMessages()}
                title="New Chat"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <SettingsPanel
              preferences={preferences}
              onUpdate={updatePreferences}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Chat Messages */}
          <ChatPanel
            messages={convertedMessages}
            isTyping={isTyping}
            onClear={clearMessages}
          />

          {/* Input Area */}
          <div className="input-area">
            {isListening && (
              <div className="voice-indicator">
                <span className="voice-dot"></span>
                Listening: {interimTranscript || '...'}
              </div>
            )}
            <div className="input-row">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bhai, kya bol raha hai..."
                className="message-input"
                disabled={isTyping}
              />
              {speechSupported && (
                <button
                  className={`voice-btn ${isListening ? 'active' : ''}`}
                  onClick={handleVoiceInput}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send size={20} />
              </button>
            </div>
          </div>

          {/* Voice Upload */}
          <div className="voice-upload-section">
            <label className="upload-btn">
              <Upload size={16} />
              <span>Clone Your Voice</span>
              <input
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg"
                className="hidden"
              />
            </label>
            {preferences.clonedVoiceId && (
              <span className="voice-cloned-badge">Voice Cloned</span>
            )}
          </div>

          {/* No controls here anymore - moved to Settings */}
        </div>
      </div>

      {/* Right Panel - 70% */}
      <div className="right-panel">
        <CameraPanel
          enabled={cameraEnabled}
          onToggle={() => setCameraEnabled(!cameraEnabled)}
          onMoodChange={handleMoodChange}
          currentMood={currentMood}
          moodConfidence={moodConfidence}
        />

        {/* Mood Badge */}
        <div className="mood-badge" data-mood={currentMood}>
          <span className="mood-emoji">
            {currentMood === 'happy' && '😊'}
            {currentMood === 'sad' && '😢'}
            {currentMood === 'angry' && '😠'}
            {currentMood === 'bored' && '😴'}
            {currentMood === 'neutral' && '😐'}
          </span>
          <span className="mood-text">{currentMood}</span>
          {moodConfidence > 0 && (
            <span className="mood-confidence">{Math.round(moodConfidence * 100)}%</span>
          )}
        </div>

        {/* Connection Status */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`} style={{ zIndex: 1 }}>
          <span className="status-dot"></span>
          {isConnected ? 'Connected' : 'Offline'}
        </div>
      </div>
    </div>
  );
}

export default App;
