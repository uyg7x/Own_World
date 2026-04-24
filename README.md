# 🧘 PJY SelfCare - Emotional Wellness Companion

An AI-powered emotional wellness companion that detects your mood through facial expressions, provides comfort through conversation, and speaks to you in your cloned voice.

![Status](https://img.shields.io/badge/Status-Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688)
![Python](https://img.shields.io/badge/Python-3.10-blue)

---

## 🎯 Features

### 🖥️ Smart UI Layout
- **Left Panel (30%)**: Chat, settings, controls
- **Right Panel (70%)**: Live camera feed with mood detection
- Clean, minimal design with warm color palette
- Responsive layout

### 📸 Real-Time Mood Detection
- Face expression analysis using face-api.js
- Detects: Happy, Sad, Angry, Bored, Neutral
- All processing happens locally (zero face data stored)
- Works with standard webcam (640x480)

### 🤖 Auto-Comfort System
- Automatically triggers when negative mood detected
- Starts with light joke in your language
- Followed by calming conversation
- 35-second cooldown prevents spam
- Toggle ON/OFF in Settings → Advanced

### 🗣️ Voice Features
- Voice input via browser Speech Recognition
- AI responses spoken in your cloned voice (ElevenLabs)
- Multi-language: Hindi, Tamil, Punjabi, Bengali, English
- Upload .mp3/.wav to clone your voice

### 💬 AI Conversation
- Persona-based: Bestie, Family, or Mentor
- Hinglish/regional tone matching
- Learns your likes/dislikes
- Concise responses (3-4 lines max)

### 🔐 Privacy First
- Zero face/image storage
- Audio only uploaded for voice cloning
- Mental health disclaimer included
- Transparent AI usage

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.10+
- Webcam (for mood detection)
- Microphone (for voice input)

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/pjy-selfcare.git
cd pjy-selfcare
```

### 2. Install Frontend Dependencies
```bash
pnpm install
```

### 3. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create `.env` file in root directory:
```env
VITE_API_URL=http://localhost:8000
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

Create `backend/.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

### 5. Start Backend Server
```bash
cd backend
python main.py
```
Server runs on http://localhost:8000

### 6. Start Frontend (New Terminal)
```bash
pnpm dev
```
App runs on http://localhost:5173

---

## 📁 Project Structure

```
pjy-selfcare/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API calls
│   ├── types/              # TypeScript types
│   └── App.tsx             # Main app component
├── backend/                # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── config.py           # Configuration
│   └── requirements.txt    # Python dependencies
├── public/                 # Static assets
│   └── models/             # Face detection models
├── .env                    # Environment variables (DO NOT COMMIT)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🛠️ Tech Stack

### Frontend
- React 18.3 with TypeScript
- Vite 6.2 (build tool)
- Tailwind CSS (styling)
- face-api.js (mood detection)
- Web Speech API (voice input)

### Backend
- FastAPI 0.136
- Python 3.10
- Groq API (LLM - Llama 3.3 70B)
- ElevenLabs API (voice cloning)

---

## 🎨 Customization

### Change App Name
Edit `src/App.tsx` line ~192:
```tsx
<span>PJY SelfCare</span>
```

### Change Colors
Edit `src/App.css` CSS variables:
```css
:root {
  --accent-primary: #e07a5f;
  --accent-secondary: #c9956c;
}
```

### Adjust Auto-Comfort Settings
Edit `backend/config.py`:
```python
COOLDOWN_SECONDS = 35  # Change cooldown duration
```

---

## 🔑 API Keys Required

1. **Groq API** (AI Chat)
   - Get free key: https://console.groq.com/
   - Used for: AI conversation generation

2. **ElevenLabs API** (Voice Cloning)
   - Get free key: https://elevenlabs.io/
   - Used for: Voice cloning and TTS

---

## 📝 What to Commit to GitHub

### ✅ DO Commit:
- `src/` - All frontend code
- `backend/` - Python backend code (EXCEPT .env)
- `public/` - Static assets
- `package.json`, `pnpm-lock.yaml`
- `requirements.txt`
- `.gitignore`, `README.md`
- Configuration files (tsconfig, vite, tailwind, etc.)

### ❌ DO NOT Commit:
- `.env` files (contains API keys)
- `node_modules/`
- `dist/` or `build/`
- `__pycache__/`
- `*.pyc` files
- IDE files (`.vscode/`, `.idea/`)

---

## 🚨 Important Notes

### Security
- Never commit `.env` files with API keys
- Use environment variables for sensitive data
- Backend CORS is set to `*` (restrict in production)

### Performance
- Face detection runs at ~30 FPS
- Models load in ~2-3 seconds
- Voice cloning requires ~30 seconds of audio

### Browser Support
- Chrome/Edge recommended (best Web Speech API support)
- Firefox/Safari partially supported
- Camera permissions required for mood detection

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects

---

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection
- [Groq](https://groq.com/) - Fast LLM inference
- [ElevenLabs](https://elevenlabs.io/) - Voice cloning
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check existing issues for solutions

**Mental Health Disclaimer**: This app is for wellness support only, not a replacement for professional mental health care.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- API Keys:
  - [Groq API Key](https://console.groq.com/keys) (for Llama 3)
  - [ElevenLabs API Key](https://elevenlabs.io/profile) (for voice cloning/TTS)

### Backend Setup

```bash
cd emotional-wellness-companion/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your API keys:
# GROQ_API_KEY=your_groq_key_here
# ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Run backend
python main.py
```

Backend will start at `http://localhost:8000`

### Frontend Setup

```bash
cd emotional-wellness-companion

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Frontend will start at `http://localhost:5173`

---

## 📁 Project Structure

```
emotional-wellness-companion/
├── backend/
│   ├── main.py           # FastAPI server
│   ├── config.py         # Configuration
│   ├── requirements.txt  # Python dependencies
│   └── .env.example     # Environment template
├── public/
│   ├── manifest.json     # PWA manifest
│   └── models/           # face-api.js models (download separately)
├── src/
│   ├── App.tsx           # Main app component
│   ├── App.css           # Styles
│   ├── components/
│   │   ├── ChatPanel.tsx
│   │   ├── CameraPanel.tsx
│   │   └── SettingsPanel.tsx
│   ├── hooks/
│   │   ├── useFaceDetection.ts
│   │   ├── useSpeechRecognition.ts
│   │   ├── useTextToSpeech.ts
│   │   └── useLocalStorage.ts
│   ├── services/
│   │   └── api.ts
│   └── types/
│       └── index.ts
├── .env                  # Frontend environment
├── package.json
└── tailwind.config.js
```

---

## 🎨 Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| Hindi | `hi` | हिंदी |
| English | `en` | English |
| Tamil | `ta` | தமிழ் |
| Punjabi | `pa` | ਪੰਜਾਬੀ |
| Bengali | `bn` | বাংলা |

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:8000
```

### Mood Detection Thresholds

Edit `backend/config.py`:
```python
MOOD_THRESHOLDS = {
    "angry": 0.5,
    "sad": 0.4,
    "bored": 0.5,
    "happy": 0.6
}
```

---

## 🌐 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build command: `pnpm build`
3. Set output directory: `dist`
4. Add environment variable:
   - `VITE_API_URL` = your backend URL

### Backend (Render)

1. Create new Web Service on Render
2. Connect your repository
3. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python main.py`
4. Add environment variables:
   - `GROQ_API_KEY`
   - `ELEVENLABS_API_KEY`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | Python FastAPI + Uvicorn |
| Face Detection | face-api.js (browser-side) |
| AI | Groq API (Llama 3) |
| Voice | ElevenLabs API |
| Speech-to-Text | Web Speech API |

---

## ⚠️ Disclaimer

**Wellness Buddy** is an AI companion designed to provide emotional support through conversation. It is **NOT** a replacement for professional mental health services. If you're experiencing mental health challenges, please consult a qualified healthcare professional.

---

## 📄 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for emotional wellness
