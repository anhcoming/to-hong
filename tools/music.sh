#!/usr/bin/env bash
# Nén một bản thu thành nhạc mẫu cho thiệp: MP3 96kbps stereo, âm lượng chuẩn hoá (để các bản to nhỏ như nhau),
# tối đa 4 phút, vào nhẹ 1.5 giây và nhỏ dần 4 giây cuối (thiệp phát lặp lại nên chỗ nối không bị giật).
# Dùng: tools/music.sh <tệp gốc> <id>   → public/music/<id>.mp3
set -euo pipefail
src="$1"; id="$2"
out="$(dirname "$0")/../public/music/$id.mp3"
max=240
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
len=$(python3 -c "print(min(float('$dur'), $max))")
fade=$(python3 -c "print(max(0, $len - 4))")
ffmpeg -y -hide_banner -loglevel error -i "$src" -t "$len" -vn \
  -af "loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=1.5,afade=t=out:st=$fade:d=4" \
  -ac 2 -ar 44100 -codec:a libmp3lame -b:a 96k -map_metadata -1 "$out"
echo "$out $(du -k "$out" | cut -f1)KB ${len%.*}s"
