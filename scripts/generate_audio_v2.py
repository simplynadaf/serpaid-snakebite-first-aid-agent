#!/usr/bin/env python3
"""Generate SerpAID produced-demo narration audio with Amazon Polly (long-form Ruth)."""
import json, os, boto3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "audio")
os.makedirs(OUT, exist_ok=True)
script = json.load(open(os.path.join(ROOT, "demo", "narration-v2.json"), encoding="utf-8"))
polly = boto3.client("polly", region_name="us-east-1")

for seg in script["segments"]:
    r = polly.synthesize_speech(Text=seg["text"], VoiceId=script["voice"],
                                Engine=script["engine"], OutputFormat="mp3")
    path = os.path.join(OUT, seg["id"] + ".mp3")
    open(path, "wb").write(r["AudioStream"].read())
    print("wrote", os.path.basename(path))
