import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Groq API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# ElevenLabs API Configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

# Server Configuration
HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
PORT = int(os.getenv("BACKEND_PORT", "8000"))

# Mood Detection Thresholds
MOOD_THRESHOLDS = {
    "angry": 0.5,
    "sad": 0.4,
    "bored": 0.5,
    "happy": 0.6
}

# Auto-Comfort Settings
COOLDOWN_SECONDS = 35
