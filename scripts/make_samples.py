"""
Generate the public SAMPLES pack for the repo.

For each example case this writes, into samples/:
  - a single samples.json (all cases: input, severity, myth, english, translated, audio file)
  - one <case>.<lang>.mp3 spoken sample per case (real Amazon Polly)
  - a human-readable SAMPLES.md table

Everything is produced by the SAME real pipeline the live agent uses:
the deterministic WHO engine, Amazon Translate, and Amazon Polly. So the
samples are exactly what a tester would get back.
"""
import json, os, boto3
from serpaid.engine import build_plan

REGION = "us-east-1"
OUT = "samples"
AUD = os.path.join(OUT, "audio")
os.makedirs(AUD, exist_ok=True)

VOICE = {
    "hi": ("hi", "Kajal", "neural", "Hindi"),
    "pt": ("pt", "Camila", "neural", "Portuguese"),
    "es": ("es", "Lucia", "neural", "Spanish"),
    "fr": ("fr", "Lea", "neural", "French"),
    "en": ("en", "Kajal", "neural", "English"),
}

CASES = [
    {"id": "tourniquet-eyelids", "lang": "hi", "region": "IN", "signs": ["drooping_eyelids"],
     "text": "My cousin was just bitten by a snake on the ankle near Pune. Should I tie a tight cloth above the bite and take him to the village healer? His eyelids feel heavy."},
    {"id": "ice-remote", "lang": "pt", "region": "BR", "signs": [],
     "text": "A farm worker was bitten in the field. We packed the wound in ice while we wait. He is hours from any clinic."},
    {"id": "suction-breathing", "lang": "es", "region": "US", "signs": ["trouble_breathing"],
     "text": "My son was bitten by a snake and now he is having trouble breathing. His uncle is trying to suck the venom out."},
    {"id": "bleeding-scared", "lang": "fr", "region": "KE", "signs": ["persistent_bleeding"],
     "text": "A woman was bitten near the river and the wound keeps bleeding. We are very scared and do not know what to do."},
    {"id": "no-myth-english", "lang": "en", "region": "US", "signs": [],
     "text": "A hiker was bitten on the hand an hour ago. What should we do while we drive to the hospital?"},
]

translate = boto3.client("translate", region_name=REGION)
polly = boto3.client("polly", region_name=REGION)


def to_english_full(plan):
    lines = []
    mc = plan.get("myth_correction")
    if mc:
        lines.append(f"Important: {mc['correction']}")
    for s in plan["steps"]:
        lines.append(f"{s['order']}. {s['detail']}")
    lines.append(plan["closing"])
    lines.append(f"Emergency number: {plan['emergency_number']}.")
    return "\n".join(lines)


def to_spoken(plan):
    lines = []
    mc = plan.get("myth_correction")
    if mc:
        lines.append(f"Important. {mc['correction']}")
    lines.append("Keep the person calm and still, and do not move the bitten limb.")
    lines.append(plan["closing"])
    lines.append(f"Call emergency number {plan['emergency_number']} now.")
    return " ".join(lines)


def tr(text, lang):
    tcode = VOICE[lang][0]
    if tcode == "en":
        return text
    return translate.translate_text(Text=text, SourceLanguageCode="en", TargetLanguageCode=tcode)["TranslatedText"]


records = []
for c in CASES:
    plan = build_plan(c["signs"], c["text"], c["region"])
    english = to_english_full(plan)
    spoken_en = to_spoken(plan)
    translated = tr(english, c["lang"])
    spoken = tr(spoken_en, c["lang"])
    tcode, voice, engine, label = VOICE[c["lang"]]
    audio = polly.synthesize_speech(Text=spoken, VoiceId=voice, Engine=engine, OutputFormat="mp3")["AudioStream"].read()
    audio_name = f"audio/{c['id']}.{c['lang']}.mp3"
    with open(os.path.join(OUT, f"{c['id']}.{c['lang']}.mp3").replace(f"{OUT}/", f"{AUD}/"), "wb") as f:
        f.write(audio)
    records.append({
        "id": c["id"],
        "input_message": c["text"],
        "answer_language": label,
        "country": c["region"],
        "severity": plan["severity"],
        "myth_caught": (plan.get("myth_correction") or {}).get("myth"),
        "myth_correction": (plan.get("myth_correction") or {}).get("correction"),
        "emergency_number": plan["emergency_number"],
        "output_english": english,
        "output_translated": translated,
        "spoken_audio": audio_name,
    })
    print(f"sample: {c['id']} [{label}] severity={plan['severity']} audio={audio_name} ({len(audio)}B)")

with open(os.path.join(OUT, "samples.json"), "w", encoding="utf-8") as f:
    json.dump({"generated_by": "serpaid.engine + Amazon Translate + Amazon Polly", "cases": records}, f, ensure_ascii=False, indent=2)

# human-readable markdown
md = ["# SerpAID — sample inputs, outputs, and audio",
      "",
      "These are **real** responses from the SerpAID pipeline (the deterministic WHO engine + Amazon Translate + Amazon Polly), not hand-written. Play the audio to hear exactly what a caller hears.",
      "",
      "> SerpAID gives WHO-grounded first aid. It does not diagnose the snake or replace a hospital. Every answer ends in: reach a facility with antivenom now.",
      ""]
for r in records:
    md += [f"## {r['id']}  ·  {r['answer_language']}  ·  {r['severity'].upper()}",
           "",
           f"**You type (the caller's message):**",
           "",
           f"> {r['input_message']}",
           "",
           f"**SerpAID catches:** " + (f"the \"{r['myth_caught']}\" myth" if r['myth_caught'] else "no harmful action in this message"),
           "",
           f"**Spoken answer (play this):** [`{r['spoken_audio']}`]({r['spoken_audio']})",
           "",
           f"**Full written answer ({r['answer_language']}):**",
           "",
           "```",
           r["output_translated"],
           "```",
           "",
           f"**English reference:**",
           "",
           "```",
           r["output_english"],
           "```",
           f"\nEmergency number used: **{r['emergency_number']}**",
           "",
           "---",
           ""]
with open(os.path.join(OUT, "SAMPLES.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(md))
print("wrote samples/samples.json and samples/SAMPLES.md")
