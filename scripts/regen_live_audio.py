"""Regenerate the 4 live-demo Polly mp3s directly (same cases, real Translate+Polly)."""
import json, os, boto3
from serpaid.engine import build_plan

REGION = "us-east-1"
OUT = "demo/live-raw/audio"
os.makedirs(OUT, exist_ok=True)

VOICE = {
    "hi": ("hi", "Kajal", "neural"),
    "pt": ("pt", "Camila", "neural"),
    "es": ("es", "Lucia", "neural"),
    "fr": ("fr", "Lea", "neural"),
}
CASES = [
    ("hi", "IN", ["drooping_eyelids"], "My cousin was just bitten by a snake on the ankle near Pune. Should I tie a tight cloth above the bite and take him to the village healer? His eyelids feel heavy."),
    ("pt", "BR", [], "A farm worker was bitten in the field. We packed the wound in ice while we wait. He is hours from any clinic."),
    ("es", "US", ["trouble_breathing"], "My son was bitten by a snake and now he is having trouble breathing. His uncle is trying to suck the venom out."),
    ("fr", "KE", ["persistent_bleeding"], "A woman was bitten near the river and the wound keeps bleeding. We are very scared and do not know what to do."),
]

translate = boto3.client("translate", region_name=REGION)
polly = boto3.client("polly", region_name=REGION)


def to_english(plan):
    """Concise SPOKEN urgent summary: the myth correction, the single most
    important action, and the emergency number. The full step list still shows
    on screen; the voice speaks what matters first, like a real emergency line."""
    lines = []
    mc = plan.get("myth_correction")
    if mc:
        lines.append(f"Important. {mc['correction']}")
    lines.append("Keep the person calm and still, and do not move the bitten limb.")
    lines.append(plan["closing"])
    lines.append(f"Call emergency number {plan['emergency_number']} now.")
    return " ".join(lines)


for i, (lang, region, signs, text) in enumerate(CASES):
    plan = build_plan(signs, text, region)
    english = to_english(plan)
    tcode, voice, engine = VOICE[lang]
    translated = translate.translate_text(Text=english, SourceLanguageCode="en", TargetLanguageCode=tcode)["TranslatedText"]
    audio = polly.synthesize_speech(Text=translated, VoiceId=voice, Engine=engine, OutputFormat="mp3")["AudioStream"].read()
    path = os.path.join(OUT, f"speak-{i}.mp3")
    with open(path, "wb") as f:
        f.write(audio)
    print(f"wrote {path} ({len(audio)} bytes, {lang})")
