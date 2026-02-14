# iHateLinks

A Discord bot that automatically downloads and re-uploads media from various social platforms, fixing embeds that Discord doesn't handle well. Handles compression as well, managing to bypass upload size limits.  Been doing that since 2022.

## Supported Platforms

- **Instagram** - Reels, Posts, TV, Carousels
- **TikTok** - Videos (including Douyin)
- **Twitter/X** - Videos
- **Reddit** - Videos

## Features

- 🎬 Auto-detects media URLs in messages
- 📦 Downloads and re-uploads media directly to Discord
- 🗜️ Automatic compression for large files
- 📊 Respects Discord server boost tier upload limits
- 🔢 Select specific items from carousel posts (e.g., "2" or "sve/all")
- 🔄 Python fallback for restricted Instagram content

## Project Structure

```
ihateinstagram/
├── src/
│   ├── index.js              # Entry point
│   ├── bot.js                # Discord client setup
│   ├── config.js             # Configuration
│   ├── handlers/
│   │   └── messageHandler.js # URL routing
│   ├── platforms/
│   │   ├── index.js          # Platform exports
│   │   ├── instagram.js      # Instagram handler
│   │   ├── tiktok.js         # TikTok handler
│   │   ├── twitter.js        # Twitter/X handler
│   │   ├── reddit.js         # Reddit handler
│   │   └── pinterest.js      # Pinterest handler
│   ├── utils/
│   │   ├── download.js       # Download utilities
│   │   ├── fileUtils.js      # File operations
│   │   └── compression.js    # Video compression
│   └── scripts/
│       └── insta.py          # Python Instagram fallback
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
npm install
pip install instaloader instagrapi --break-system-packages
```

### 2. Configure

Edit `src/config.js`:

```javascript
module.exports = {
    discord: {
        token: "YOUR_DISCORD_BOT_TOKEN"
    },
    instagram: {
        sessionId: "YOUR_INSTAGRAM_SESSION_ID"
    }
};
```

Also update the session ID in `src/scripts/insta.py`. I still need to patch this up :)

### 3. Get Instagram Session ID

1. Log into Instagram in Firefox
2. Open DevTools (F12) → Storage → Cookies → instagram.com
3. Copy the `sessionid` value

### 4. Run

```bash
npm start
# or
node src/index.js
# or
pm2 start src/index.js
```

## Usage

Just paste a supported URL in any channel the bot can see:

```
https://www.instagram.com/reel/ABC123/
https://www.tiktok.com/@user/video/123456
https://twitter.com/user/status/123456
```

### Carousel Selection

For Instagram carousels:
- No number = first item
- `2` = second item
- `sve` or `all` = all items

## Requirements

- Node.js 18+
- Python 3.8+
- ffmpeg (for compression)
- Chromium (for Reddit/Pinterest)

## Dependencies

### Node.js
- discord.js
- instagram-url-direct
- tiktokdl
- get-twitter-media
- axios
- puppeteer

### Python
- instaloader
- instagrapi
