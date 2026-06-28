import sys
import os
import subprocess
import json
import tempfile

SESSION_ID = sys.argv[2] if len(sys.argv) > 2 else ""
url = sys.argv[1]

cookies_file = tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False)
cookies_file.write("# Netscape HTTP Cookie File\n")
cookies_file.write(f".instagram.com\tTRUE\t/\tTRUE\t0\tsessionid\t{SESSION_ID}\n")
cookies_file.close()

try:
    result = subprocess.run([
        "gallery-dl", "-j",
        "--cookies", cookies_file.name,
        url
    ], capture_output=True, text=True)

    if result.returncode != 0:
        print(result.stderr or result.stdout, file=sys.stderr)
        sys.exit(1)

    data = json.loads(result.stdout)

    for entry in data:
        if entry[0] == 3:
            media_url = entry[1]
            metadata = entry[2] if len(entry) > 2 else {}

            if media_url.startswith("ytdl:"):
                direct_url = metadata.get("video_url")
                if direct_url:
                    print(direct_url)
                else:
                    actual_url = media_url[5:]
                    tmpdir = tempfile.mkdtemp(prefix="insta_")
                    out = os.path.join(tmpdir, "video.mp4")
                    dl = subprocess.run([
                        "yt-dlp", "--cookies", cookies_file.name,
                        "--merge-output-format", "mp4",
                        "-o", out, actual_url
                    ], capture_output=True, text=True)
                    if dl.returncode == 0:
                        print(out)
                    else:
                        print(dl.stderr, file=sys.stderr)
            else:
                print(media_url)

finally:
    os.unlink(cookies_file.name)
