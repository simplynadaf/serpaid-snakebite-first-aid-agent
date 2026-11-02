"""
SerpAID live demo bridge.

A thin local server that makes the SerpAID agent genuinely interactive for a
live, on-camera demo: you type a panicked message, and it returns the real
WHO-grounded plan, translated live with Amazon Translate and spoken live with
Amazon Polly in the caller's language.

This is NOT a mock. Every /ask call:
  1. runs the deterministic WHO engine (the same code the Strands graph uses),
  2. calls Amazon Translate for the mother-tongue text,
  3. calls Amazon Polly for the spoken audio.

Run:
    cd ~/serpaid-snakebite-first-aid-agent
    .venv/bin/python -m uvicorn livedemo.server:app --host 127.0.0.1 --port 8808
"""

from __future__ import annotations

import io
from pathlib import Path

import boto3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from serpaid.engine import build_plan, detect_myth, grade_severity

REGION = "us-east-1"
HERE = Path(__file__).parent

# Languages we can SPEAK live (verified Polly support). Marathi/Tamil/Telugu/
# Bengali/Swahili have translation but no Polly voice, so they are text-only.
# Amazon Translate uses the base language code; Polly needs a voice id.
VOICE_BY_LANG = {
    "hi": {"translate": "hi", "polly_voice": "Kajal", "polly_engine": "neural", "label": "Hindi"},
    "es": {"translate": "es", "polly_voice": "Lucia", "polly_engine": "neural", "label": "Spanish"},
    "fr": {"translate": "fr", "polly_voice": "Lea", "polly_engine": "neural", "label": "French"},
    "pt": {"translate": "pt", "polly_voice": "Camila", "polly_engine": "neural", "label": "Portuguese"},
    "ar": {"translate": "ar", "polly_voice": "Zeina", "polly_engine": "standard", "label": "Arabic"},
    "en": {"translate": "en", "polly_voice": "Kajal", "polly_engine": "neural", "label": "English (India)"},
}

app = FastAPI(title="SerpAID live demo")

# Allow the hosted/static page (any origin, incl. file:// which sends Origin: null)
# to call this local bridge for the true live demo.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_translate = boto3.client("translate", region_name=REGION)
_polly = boto3.client("polly", region_name=REGION)


class AskRequest(BaseModel):
    text: str
    lang: str = "en"
    region_code: str = "IN"
    signs: list[str] | None = None


def _plan_to_english(plan: dict) -> str:
    """Full on-screen English block: all WHO steps."""
    lines: list[str] = []
    mc = plan.get("myth_correction")
    if mc:
        lines.append(f"Important: {mc['correction']}")
    for step in plan["steps"]:
        lines.append(f"{step['order']}. {step['detail']}")
    lines.append(plan["closing"])
    lines.append(f"Emergency number: {plan['emergency_number']}.")
    return "\n".join(lines)


def _plan_to_spoken(plan: dict) -> str:
    """Concise urgent SPOKEN summary: what an emergency voice line says first."""
    lines: list[str] = []
    mc = plan.get("myth_correction")
    if mc:
        lines.append(f"Important. {mc['correction']}")
    lines.append("Keep the person calm and still, and do not move the bitten limb.")
    lines.append(plan["closing"])
    lines.append(f"Call emergency number {plan['emergency_number']} now.")
    return " ".join(lines)


def _translate_text(text: str, lang: str) -> str:
    cfg = VOICE_BY_LANG.get(lang, VOICE_BY_LANG["en"])
    if cfg["translate"] == "en":
        return text
    resp = _translate.translate_text(
        Text=text, SourceLanguageCode="en", TargetLanguageCode=cfg["translate"]
    )
    return resp["TranslatedText"]


@app.get("/")
def index() -> FileResponse:
    return FileResponse(HERE / "index.html")


@app.post("/ask")
def ask(req: AskRequest) -> JSONResponse:
    """Run the real engine + live Amazon Translate. Returns text; audio via /speak."""
    signs = req.signs or _auto_signs(req.text)
    plan = build_plan(signs, req.text, req.region_code or None)
    english = _plan_to_english(plan)
    spoken_en = _plan_to_spoken(plan)
    translated = _translate_text(english, req.lang)
    spoken = _translate_text(spoken_en, req.lang)
    myth = plan.get("myth_correction")
    return JSONResponse(
        {
            "severity": plan["severity"],
            "severity_reason": plan["severity_reason"],
            "myth": myth,
            "emergency_number": plan["emergency_number"],
            "english": english,
            "translated": translated,
            "spoken": spoken,
            "lang_label": VOICE_BY_LANG.get(req.lang, VOICE_BY_LANG["en"])["label"],
            "can_speak": req.lang in VOICE_BY_LANG,
        }
    )


class SpeakRequest(BaseModel):
    text: str
    lang: str = "en"


@app.post("/speak")
def speak(req: SpeakRequest) -> StreamingResponse:
    """Synthesize the translated text live with Amazon Polly and stream mp3."""
    cfg = VOICE_BY_LANG.get(req.lang, VOICE_BY_LANG["en"])
    resp = _polly.synthesize_speech(
        Text=req.text,
        VoiceId=cfg["polly_voice"],
        Engine=cfg["polly_engine"],
        OutputFormat="mp3",
    )
    audio = resp["AudioStream"].read()
    return StreamingResponse(io.BytesIO(audio), media_type="audio/mpeg")


def _auto_signs(text: str) -> list[str]:
    """Light keyword mapping so the demo can report danger signs from free text."""
    t = text.lower()
    found = []
    table = {
        "trouble_breathing": ["can't breathe", "cannot breathe", "trouble breathing", "breathing"],
        "trouble_swallowing": ["swallow"],
        "drooping_eyelids": ["eyelid", "eyelids", "droop", "heavy eyes"],
        "limb_weakness": ["weak", "weakness", "numb"],
        "persistent_bleeding": ["bleeding", "won't stop bleeding"],
        "severe_swelling": ["swelling", "swollen"],
        "drowsy_collapse": ["collapse", "faint", "unconscious", "drowsy"],
    }
    for sign, keys in table.items():
        if any(k in t for k in keys):
            found.append(sign)
    return found
