"""
Emotional Wellness Companion - FastAPI Backend
Handles AI conversations, voice cloning, and auto-comfort logic
"""

import os
import json
import time
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime
from groq import Groq
import elevenlabs
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from config import (
    GROQ_API_KEY, GROQ_MODEL, ELEVENLABS_API_KEY,
    MOOD_THRESHOLDS, COOLDOWN_SECONDS
)

# Load environment
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Initialize FastAPI
app = FastAPI(
    title="Emotional Wellness Companion API",
    description="AI-powered emotional wellness assistant with voice cloning",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# In-memory storage for user preferences (in production, use a database)
user_preferences: Dict[str, Dict[str, Any]] = {}
comfort_timestamps: Dict[str, float] = {}

# ============ Pydantic Models ============

class ConversationRequest(BaseModel):
    message: str
    user_id: str = "default"
    language: str = "hi"  # Hindi default, also: en, ta, pa, bn
    persona: str = "friend"  # friend, family, wise
    mood: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class MoodUpdate(BaseModel):
    user_id: str = "default"
    mood: str
    confidence: float = 1.0

class PreferencesUpdate(BaseModel):
    user_id: str = "default"
    likes: Optional[List[str]] = None
    dislikes: Optional[List[str]] = None
    name: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "eleven_monolingual_v1"  # Default voice
    user_id: str = "default"

# ============ Helper Functions ============

def get_persona_prompt(persona: str, language: str) -> str:
    """Generate persona-based system prompt"""
    persona_config = {
        "friend": {
            "hi": "Tu mera bestie hai, casual aur funny bol. Hinglish mein baat kar. Max 3-4 lines mein reply kar.",
            "en": "You're my best friend, casual and funny. Keep replies to 3-4 lines max.",
            "ta": "You are my best friend, casual and funny. Reply in Tamil Hinglish.",
            "pa": "You are my best friend, casual and funny. Reply in Punjabi Hinglish.",
            "bn": "You are my best friend, casual and funny. Reply in Bengali Hinglish."
        },
        "family": {
            "hi": "Tu meri family ka member hai, care aur warmth ke saath bol. Hinglish mein baat kar. Max 3-4 lines.",
            "en": "You're my family, caring and warm. Keep replies to 3-4 lines max.",
            "ta": "You are my family, caring and warm. Reply in Tamil Hinglish.",
            "pa": "You are my family, caring and warm. Reply in Punjabi Hinglish.",
            "bn": "You are my family, caring and warm. Reply in Bengali Hinglish."
        },
        "wise": {
            "hi": "Tu wise aur calm mentor hai, advice de lekin light bhi rakh. Hinglish mein baat kar. Max 3-4 lines.",
            "en": "You're a wise mentor, calm and thoughtful. Keep replies to 3-4 lines max.",
            "ta": "You are a wise mentor, calm and thoughtful. Reply in Tamil Hinglish.",
            "pa": "You are a wise mentor, calm and thoughtful. Reply in Punjabi Hinglish.",
            "bn": "You are a wise mentor, calm and thoughtful. Reply in Bengali Hinglish."
        }
    }
    return persona_config.get(persona, persona_config["friend"]).get(language, persona_config["friend"]["hi"])

def get_mood_joke(mood: str, language: str) -> str:
    """Get a light joke based on detected mood"""
    jokes = {
        "angry": {
            "hi": "Bhai, itna gussa kyon? Camera dekh ke smile kar, filter bhi lagata hoon! 📸",
            "en": "Why so serious? Even the camera is smiling at you! 📸",
            "ta": "Pa,enna nadakama? Camera va smile pannu, filter la irukku! 📸",
            "pa": "Bhai, ki dard? Camera nu look kar, filter lainu! 📸",
            "bn": "Dada, ki cholchole? Camera dekhe hansi, filter o lagabo! 📸"
        },
        "sad": {
            "hi": "Arrey yaar, tuze dekh kar main bhi sad ho gaya... wait, camera toh mere paas hai! 😄",
            "en": "Seeing you makes me sad... wait, that's the camera's job! 😄",
            "ta": "Nanba, nee pathu enna sadama... wait, camera la irukku! 😄",
            "pa": "Bhai, tusi dekh ke mainu vi sad ho gaya... wait, camera ch压力大! 😄",
            "bn": "Baba, tumi dekhe ami sad holam... wait, camera e cholchole! 😄"
        },
        "bored": {
            "hi": "Bored? Main hoon na! Chat kar, nahi toh meme bhej dunga! 😜",
            "en": "Bored? I'm right here! Let's chat or I'll spam you with memes! 😜",
            "ta": "Bored? Enna va, chat pannu, meme va send pannu! 😜",
            "pa": "Bored? Main aa! Chat kar, warna meme bhej daina! 😜",
            "bn": "Bored? Ami ache! Chat karo, na hole meme pathabo! 😜"
        }
    }
    return jokes.get(mood, {}).get(language, jokes["angry"]["hi"])

def check_cooldown(user_id: str) -> bool:
    """Check if auto-comfort is on cooldown"""
    if user_id not in comfort_timestamps:
        return True
    elapsed = time.time() - comfort_timestamps[user_id]
    return elapsed >= COOLDOWN_SECONDS

def get_user_preferences(user_id: str) -> Dict[str, Any]:
    """Get stored user preferences"""
    return user_preferences.get(user_id, {})

# ============ API Endpoints ============

@app.get("/")
async def root():
    return {"message": "Emotional Wellness Companion API", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "groq_connected": groq_client is not None,
        "elevenlabs_connected": bool(ELEVENLABS_API_KEY)
    }

@app.post("/chat")
async def chat(request: ConversationRequest):
    """Main chat endpoint with AI conversation"""
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    try:
        # Build context with preferences
        prefs = get_user_preferences(request.user_id)
        if request.preferences:
            prefs.update(request.preferences)

        # Build system prompt
        system_prompt = f"""You are an Indian emotional wellness companion. {get_persona_prompt(request.persona, request.language)}

        Important rules:
        - Max 3-4 lines per reply
        - Use emojis naturally
        - Never give medical/mental health advice - always suggest professional help if concerns arise
        - Be warm, caring, and supportive
        - Remember user preferences: {json.dumps(prefs)}
        - Start with a light joke if mood is negative (angry, sad, bored)
        - Current detected mood: {request.mood or 'neutral'}
        """

        # Create conversation with mood-aware system message
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]

        # Call Groq API
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=150,
            temperature=0.8
        )

        ai_response = response.choices[0].message.content

        # Learn from user preferences (simple keyword extraction)
        if request.preferences and "likes" in request.preferences:
            user_preferences[request.user_id] = prefs

        return {
            "response": ai_response,
            "mood_used": request.mood,
            "language": request.language
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auto-comfort")
async def auto_comfort(request: ConversationRequest):
    """Trigger auto-comfort when bad mood detected"""
    if not groq_client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    if not check_cooldown(request.user_id):
        remaining = COOLDOWN_SECONDS - (time.time() - comfort_timestamps.get(request.user_id, 0))
        raise HTTPException(status_code=429, detail=f"Cooldown active. Try in {int(remaining)}s")

    try:
        mood = request.mood or "bored"
        language = request.language

        # Start with a joke
        joke = get_mood_joke(mood, language)

        # Build comfort prompt
        comfort_prompt = f"""User is feeling {mood}. Your task is to comfort them gently.
        {get_persona_prompt(request.persona, language)}

        Response structure:
        1. Start with the joke above
        2. Add 1-2 lines of gentle, warm comfort
        3. End with a positive note

        Keep it short and light. Max 4 lines total."""

        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": comfort_prompt},
                {"role": "user", "content": f"User is {mood}. Comfort them."}
            ],
            max_tokens=150,
            temperature=0.9
        )

        comfort_response = response.choices[0].message.content

        # Update cooldown
        comfort_timestamps[request.user_id] = time.time()

        return {
            "response": comfort_response,
            "triggered_by": "auto_comfort",
            "mood_detected": mood,
            "tag": "✨ Auto-Comfort"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-mood")
async def update_mood(mood_update: MoodUpdate):
    """Update user's current mood"""
    user_preferences[mood_update.user_id] = get_user_preferences(mood_update.user_id)
    user_preferences[mood_update.user_id]["current_mood"] = mood_update.mood
    user_preferences[mood_update.user_id]["mood_confidence"] = mood_update.confidence
    user_preferences[mood_update.user_id]["last_updated"] = datetime.now().isoformat()
    return {"status": "updated", "mood": mood_update.mood}

@app.post("/update-preferences")
async def update_preferences(prefs_update: PreferencesUpdate):
    """Update user preferences (likes/dislikes)"""
    prefs = get_user_preferences(prefs_update.user_id)
    if prefs_update.likes:
        prefs["likes"] = prefs_update.likes
    if prefs_update.dislikes:
        prefs["dislikes"] = prefs_update.dislikes
    if prefs_update.name:
        prefs["name"] = prefs_update.name
    user_preferences[prefs_update.user_id] = prefs
    return {"status": "updated", "preferences": prefs}

@app.get("/get-preferences/{user_id}")
async def get_preferences(user_id: str):
    """Get user's stored preferences"""
    return {"preferences": get_user_preferences(user_id)}

@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using ElevenLabs"""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="Voice service not configured")

    try:
        elevenlabs.api_key = ELEVENLABS_API_KEY

        # Generate audio
        audio = elevenlabs.generate(
            text=request.text,
            voice=request.voice_id,
            model="eleven_multilingual_v2"
        )

        # Save to temporary file
        output_path = Path(__file__).parent / "temp_audio.mp3"
        with open(output_path, "wb") as f:
            f.write(audio)

        return FileResponse(
            str(output_path),
            media_type="audio/mpeg",
            filename="response.mp3"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/clone-voice")
async def clone_voice(user_id: str, name: str, audio: UploadFile = File(...)):
    """Clone voice from uploaded audio sample"""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="Voice service not configured")

    if audio.content_type not in ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav"]:
        raise HTTPException(status_code=400, detail="Invalid audio format. Use MP3 or WAV")

    try:
        elevenlabs.api_key = ELEVENLABS_API_KEY

        # Save uploaded file temporarily
        temp_path = Path(__file__).parent / f"temp_{user_id}_{audio.filename}"
        with open(temp_path, "wb") as f:
            content = await audio.read()
            f.write(content)

        # Clone voice
        voice = elevenlabs.voice_clone(
            name=name,
            description=f"Cloned voice for user {user_id}",
            files=[str(temp_path)]
        )

        # Clean up temp file
        temp_path.unlink()

        # Store voice ID in preferences
        prefs = get_user_preferences(user_id)
        prefs["cloned_voice_id"] = voice.voice_id
        prefs["cloned_voice_name"] = name
        user_preferences[user_id] = prefs

        return {
            "status": "cloned",
            "voice_id": voice.voice_id,
            "voice_name": name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-voices")
async def get_available_voices():
    """Get list of available ElevenLabs voices"""
    if not ELEVENLABS_API_KEY:
        return {"voices": [], "error": "Voice service not configured"}

    try:
        elevenlabs.api_key = ELEVENLABS_API_KEY
        voices = elevenlabs.voices.get_all()
        return {
            "voices": [
                {"voice_id": v.voice_id, "name": v.name, "preview_url": v.preview_url}
                for v in voices.voices[:20]  # Limit to first 20
            ]
        }
    except Exception as e:
        return {"voices": [], "error": str(e)}

@app.get("/cooldown-status/{user_id}")
async def get_cooldown_status(user_id: str):
    """Check if auto-comfort is on cooldown"""
    if user_id in comfort_timestamps:
        elapsed = time.time() - comfort_timestamps[user_id]
        remaining = max(0, COOLDOWN_SECONDS - elapsed)
        return {
            "on_cooldown": remaining > 0,
            "remaining_seconds": int(remaining)
        }
    return {"on_cooldown": False, "remaining_seconds": 0}

# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
