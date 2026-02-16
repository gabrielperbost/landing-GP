#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEO_DIR="$ROOT_DIR/public/videos"
OUTPUT_DIR="$VIDEO_DIR/posters"
TMP_DIR="$(mktemp -d)"

# Only videos used by:
# - Avis video (Tem1..Tem4)
# - Preuve sociale (video5..video8)
# Intentionally excludes:
# - Hero video
# - Process GP Finances video
VIDEOS=(
  "Tem1.mp4"
  "Tem2.mp4"
  "Tem3.mp4"
  "Tem4.mp4"
  "video5.mp4"
  "video6.mp4"
  "video7.mp4"
  "video8.mp4"
)

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

TOOL=""
if command -v ffmpeg >/dev/null 2>&1; then
  TOOL="ffmpeg"
elif command -v avconvert >/dev/null 2>&1 && command -v qlmanage >/dev/null 2>&1; then
  TOOL="avconvert+qlmanage"
elif command -v qlmanage >/dev/null 2>&1; then
  TOOL="qlmanage"
else
  echo "Error: neither ffmpeg nor qlmanage is available on this machine." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
echo "Using $TOOL to generate posters..."

for video in "${VIDEOS[@]}"; do
  input="$VIDEO_DIR/$video"
  if [[ ! -f "$input" ]]; then
    echo "Error: missing input video $input" >&2
    exit 1
  fi

  output="$OUTPUT_DIR/${video%.mp4}-poster.png"
  if [[ "$TOOL" == "ffmpeg" ]]; then
    ffmpeg -hide_banner -loglevel error -y -ss 0 -i "$input" -frames:v 1 "$output"
  elif [[ "$TOOL" == "avconvert+qlmanage" ]]; then
    clip="$TMP_DIR/${video%.mp4}-first.mov"
    avconvert --source "$input" --preset Preset640x480 --output "$clip" --replace --start 0 --duration 0.05 >/dev/null 2>&1
    qlmanage -t -s 1080 -o "$TMP_DIR" "$clip" >/dev/null 2>&1
    generated="$TMP_DIR/${video%.mp4}-first.mov.png"
    if [[ ! -f "$generated" ]]; then
      echo "Error: failed to generate first-frame thumbnail for $video via avconvert+qlmanage" >&2
      exit 1
    fi
    mv -f "$generated" "$output"
  else
    qlmanage -t -s 1080 -o "$TMP_DIR" "$input" >/dev/null 2>&1
    generated="$TMP_DIR/$video.png"
    if [[ ! -f "$generated" ]]; then
      echo "Error: failed to generate thumbnail for $video" >&2
      exit 1
    fi
    mv -f "$generated" "$output"
  fi
  echo "Generated: $output"
done

echo "Done. Posters are in $OUTPUT_DIR"
