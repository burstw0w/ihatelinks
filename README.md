# iHateLinks

Discord bot that downloads and re-uploads media from social platforms, fixing broken embeds. Handles compression to stay within upload limits. Running since 2022.

## Supported Platforms

- Instagram - Reels, Posts, Stories, Carousels
- TikTok - Videos (including Douyin)
- Twitter/X - Videos
- Reddit - Videos
- Pinterest - Videos
- YouTube Shorts

## Usage

Paste a supported URL in any channel the bot can read:

```
https://www.instagram.com/reel/ABC123/
https://www.tiktok.com/@user/video/123456
https://twitter.com/user/status/123456
```

For Instagram carousels and stories:
- No number = first item
- `2` = second item
- `sve` or `all` = all items

## Setup

### Dependencies

```bash
npm install
pip install gallery-dl yt-dlp --break-system-packages
```

Also requires `ffmpeg` and `chromium` installed system-wide.

### Config

Edit `src/config.js`:

```javascript
module.exports = {
    discord: {
        token: "YOUR_DISCORD_BOT_TOKEN"
    },
    instagram: {
        sessionId: "YOUR_INSTAGRAM_SESSION_ID"
    },
    paths: {
        pythonScript: "./scripts/insta.py",
        pythonBinary: "python3",
        chromium: "/usr/bin/chromium-browser"
    }
};
```

### Instagram Session ID

1. Log into Instagram in Firefox
2. DevTools (F12) → Storage → Cookies → instagram.com
3. Copy the `sessionid` value

### Run

```bash
npm start
# or
node src/index.js
# or
pm2 start src/index.js
```

## Project Structure

```
src/
├── index.js
├── bot.js
├── config.js
├── handlers/
│   └── messageHandler.js
├── platforms/
│   ├── instagram.js
│   ├── tiktok.js
│   ├── twitter.js
│   ├── reddit.js
│   └── pinterest.js
├── utils/
│   ├── download.js
│   ├── fileUtils.js
│   └── compression.js
└── scripts/
    └── insta.py
```
