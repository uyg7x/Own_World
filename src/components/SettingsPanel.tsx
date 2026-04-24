import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { UserPreferences, Language, Persona } from '../types';

interface SettingsPanelProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
  onClose: () => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'en', label: 'English' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
];

const PERSONAS: { value: Persona; label: string; description: string }[] = [
  { value: 'friend', label: 'Bestie', description: 'Casual aur funny' },
  { value: 'family', label: 'Family', description: 'Care aur warmth' },
  { value: 'wise', label: 'Mentor', description: 'Wise aur calm' },
];

export function SettingsPanel({ preferences, onUpdate, onClose }: SettingsPanelProps) {
  const [newLike, setNewLike] = useState('');
  const [newDislike, setNewDislike] = useState('');
  const [name, setName] = useState(preferences.name || '');

  const handleAddLike = () => {
    if (newLike.trim() && !preferences.likes.includes(newLike.trim())) {
      onUpdate({ likes: [...preferences.likes, newLike.trim()] });
      setNewLike('');
    }
  };

  const handleAddDislike = () => {
    if (newDislike.trim() && !preferences.dislikes.includes(newDislike.trim())) {
      onUpdate({ dislikes: [...preferences.dislikes, newDislike.trim()] });
      setNewDislike('');
    }
  };

  const handleRemoveLike = (item: string) => {
    onUpdate({ likes: preferences.likes.filter((l) => l !== item) });
  };

  const handleRemoveDislike = (item: string) => {
    onUpdate({ dislikes: preferences.dislikes.filter((d) => d !== item) });
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h3>Settings</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="settings-content">
        {/* Name */}
        <div className="setting-group">
          <label>Tera Naam</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onUpdate({ name: e.target.value });
            }}
            placeholder="Apna naam bata..."
            className="setting-input"
          />
        </div>

        {/* Language */}
        <div className="setting-group">
          <label>Language</label>
          <select
            value={preferences.language}
            onChange={(e) => onUpdate({ language: e.target.value as Language })}
            className="setting-select"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Persona */}
        <div className="setting-group">
          <label>Persona</label>
          <div className="persona-selector">
            {PERSONAS.map((persona) => (
              <button
                key={persona.value}
                className={`persona-btn ${preferences.persona === persona.value ? 'active' : ''}`}
                onClick={() => onUpdate({ persona: persona.value })}
              >
                <span className="persona-label">{persona.label}</span>
                <span className="persona-desc">{persona.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Likes */}
        <div className="setting-group">
          <label>Things you LIKE</label>
          <div className="tag-input-row">
            <input
              type="text"
              value={newLike}
              onChange={(e) => setNewLike(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLike()}
              placeholder="Add something you like..."
              className="tag-input"
            />
            <button className="add-btn" onClick={handleAddLike}>
              <Plus size={16} />
            </button>
          </div>
          <div className="tags-container">
            {preferences.likes.map((item) => (
              <span key={item} className="tag liked">
                {item}
                <button onClick={() => handleRemoveLike(item)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Dislikes */}
        <div className="setting-group">
          <label>Things you DISLIKE</label>
          <div className="tag-input-row">
            <input
              type="text"
              value={newDislike}
              onChange={(e) => setNewDislike(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDislike()}
              placeholder="Add something you dislike..."
              className="tag-input"
            />
            <button className="add-btn" onClick={handleAddDislike}>
              <Plus size={16} />
            </button>
          </div>
          <div className="tags-container">
            {preferences.dislikes.map((item) => (
              <span key={item} className="tag disliked">
                {item}
                <button onClick={() => handleRemoveDislike(item)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="setting-group disclaimer">
          <p>
            <strong>Note:</strong> I'm here to chat and support you, but I'm not a replacement
            for professional mental health help. If you're struggling, please reach out to a
            trusted person or professional.
          </p>
        </div>

        {/* Advanced Settings */}
        <div className="setting-group">
          <label>Advanced Settings</label>
          <div className="toggle-row">
            <span>Auto-Comfort</span>
            <button
              className={`toggle ${preferences.autoComfort ? 'on' : 'off'}`}
              onClick={() => onUpdate({ autoComfort: !preferences.autoComfort })}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
          <div className="toggle-row">
            <span>Voice Output</span>
            <button
              className={`toggle ${preferences.voiceOutput ? 'on' : 'off'}`}
              onClick={() => onUpdate({ voiceOutput: !preferences.voiceOutput })}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
