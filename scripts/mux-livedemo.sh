#!/usr/bin/env bash
# Mux each per-case clip with its live Polly audio, then concatenate to one MP4.
# Audio begins at (clip_length - audio_length) so the voice lines up with the
# on-screen response (typing happens first, then the answer + voice).
set -e
cd "$(dirname "$0")/.."
RAW=demo/live-raw
CLIPS=$RAW/clips
AUD=$RAW/audio
WORK=$RAW/work
mkdir -p "$WORK"

declare -a ORDER=("0-hindi" "1-portuguese" "2-spanish" "3-french")

dur() { ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"; }

i=0
: > "$WORK/concat.txt"
for name in "${ORDER[@]}"; do
  clip="$CLIPS/$name.webm"
  audio="$AUD/speak-$i.mp3"
  vlen=$(dur "$clip")
  alen=$(dur "$audio")
  # start audio so it ENDS ~1s before the clip ends (voice over the response)
  delay=$(python3 -c "print(max(0.0, $vlen - $alen - 1.0))")
  out="$WORK/$i-$name.mp4"
  # transcode video to h264, add silent base, overlay the polly audio at delay
  ffmpeg -y -i "$clip" -itsoffset "$delay" -i "$audio" \
    -map 0:v:0 -map 1:a:0 \
    -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 25 \
    -c:a aac -b:a 160k -shortest -af "apad" -t "$vlen" \
    "$out"
  echo "file '$(realpath "$out")'" >> "$WORK/concat.txt"
  echo "muxed $out  (video ${vlen}s, audio ${alen}s, delay ${delay}s)"
  i=$((i+1))
done

# concat all four with identical codecs
ffmpeg -y -f concat -safe 0 -i "$WORK/concat.txt" -c copy demo/serpaid-live-demo.mp4
echo "FINAL: demo/serpaid-live-demo.mp4"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 demo/serpaid-live-demo.mp4
