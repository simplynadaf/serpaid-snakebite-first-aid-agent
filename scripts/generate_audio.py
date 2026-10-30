#!/usr/bin/env python3
"""Generate SerpAID demo narration audio with Amazon Polly (long-form Ruth)."""
import json
import os
import subprocess
import boto3

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "audio")
os.makedirs(OUT, exist_ok=True)

with open(os.path.join(ROOT, "demo", "narration.json"), encoding="utf-8") as f:
    script = json.load(f)

polly = boto3.client("polly", region_name="us-east-1")
voice, engine = script["voice"], script["engine"]

parts = []
for seg in script["segments"]:
    path = os.path.join(OUT, f"{seg['id']}.mp3")
    resp = polly.synthesize_speech(
        Text=seg["text"], VoiceId=voice, Engine=engine, OutputFormat="mp3"
    )
    with open(path, "wb") as out:
        out.write(resp["AudioStream"].read())
    parts.append(path)
    print("wrote", path)

# concatenate into one narration track with ffmpeg
listfile = os.path.join(OUT, "list.txt")
with open(listfile, "w") as lf:
    for p in parts:
        lf.write(f"file '{p}'\n")
full = os.path.join(OUT, "narration-full.mp3")
subprocess.run(
    ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", listfile, "-c", "copy", full],
    check=True, capture_output=True,
)
print("wrote", full)
