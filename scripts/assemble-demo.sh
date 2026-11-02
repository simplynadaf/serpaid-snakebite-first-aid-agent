#!/usr/bin/env bash
# Assemble the narrated demo:
#   each use-case clip = narrator (English, explains) at 0s, then the real
#   localized response voice as-is after the narrator ends.
#   github clip = narrator n_github over the README scroll.
# Then concat github + 4 cases, then add intro/outro bookends.
set -e
cd "$(dirname "$0")/.."
CLIPS=demo/full-raw/clips
NARR=demo/full-raw/narration
RESP=samples/audio
WORK=demo/full-raw/work
mkdir -p "$WORK"
: > "$WORK/concat.txt"

dur(){ ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$1"; }
vdur(){ ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1:nk=1 "$1" | awk '{print $1/25}'; }

mux(){ # $1 clip  $2 narrator mp3  $3 response mp3 (or "")  $4 out  $5 respAt (secs, optional)
  local clip="$1" narr="$2" resp="$3" out="$4" respAt="$5"
  local vlen; vlen=$(vdur "$clip")
  local nlen; nlen=$(dur "$narr")
  if [ -n "$resp" ]; then
    local rlen; rlen=$(dur "$resp")
    # response voice starts exactly when the answer appears on screen (respAt).
    # fall back to narrator-end if respAt wasn't provided.
    local roff
    if [ -n "$respAt" ]; then roff="$respAt"; else roff=$(python3 -c "print(round($nlen+0.6,2))"); fi
    local tlen; tlen=$(python3 -c "print(round(min($vlen, $roff+$rlen+1.0),2))")
    local delayms; delayms=$(python3 -c "print(int($roff*1000))")
    ffmpeg -y -i "$clip" -i "$narr" -i "$resp" \
      -filter_complex "[1:a]adelay=0|0[n];[2:a]adelay=${delayms}|${delayms}[r];[n][r]amix=inputs=2:normalize=0:duration=longest[a]" \
      -map 0:v:0 -map "[a]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 25 \
      -c:a aac -b:a 160k -t "$tlen" "$out"
    echo "muxed $(basename "$out")  narr@0 (${nlen}s)  response@${roff}s via adelay (${rlen}s)  clip ${tlen}s"
  else
    local tlen; tlen=$(python3 -c "print(round(min($vlen, $nlen+1.5),2))")
    ffmpeg -y -i "$clip" -i "$narr" -map 0:v:0 -map 1:a:0 \
      -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 25 \
      -c:a aac -b:a 160k -af apad -t "$tlen" "$out"
    echo "muxed $(basename "$out")  narr only ${nlen}s  clip ${tlen}s"
  fi
  echo "file '$(realpath "$out")'" >> "$WORK/concat.txt"
}

# read the real on-screen "answer appeared" time per case from the recorder
rat(){ python3 -c "import json;print(json.load(open('demo/full-raw/timing.json')).get('$1',{}).get('respAt',''))" 2>/dev/null; }

mux "$CLIPS/0-github.webm" "$NARR/n_github.mp3"   ""                                   "$WORK/0-github.mp4"
mux "$CLIPS/1-hi.webm"     "$NARR/n_case_hi.mp3"  "$RESP/tourniquet-eyelids.hi.mp3"    "$WORK/1-hi.mp4"  "$(rat hi)"
mux "$CLIPS/2-pt.webm"     "$NARR/n_case_pt.mp3"  "$RESP/ice-remote.pt.mp3"            "$WORK/2-pt.mp4"  "$(rat pt)"
mux "$CLIPS/3-es.webm"     "$NARR/n_case_es.mp3"  "$RESP/suction-breathing.es.mp3"     "$WORK/3-es.mp4"  "$(rat es)"
mux "$CLIPS/4-fr.webm"     "$NARR/n_case_fr.mp3"  "$RESP/bleeding-scared.fr.mp3"       "$WORK/4-fr.mp4"  "$(rat fr)"

# concat the body
ffmpeg -y -f concat -safe 0 -i "$WORK/concat.txt" -c copy demo/full-raw/demo-body.mp4
echo "BODY: demo/full-raw/demo-body.mp4"
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 demo/full-raw/demo-body.mp4
