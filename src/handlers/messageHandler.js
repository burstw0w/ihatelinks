const { handleInstagram } = require("../platforms/instagram");
const { handleTikTok } = require("../platforms/tiktok");
const { handleTwitter } = require("../platforms/twitter");
const { handleReddit } = require("../platforms/reddit");
const { handlePinterest } = require("../platforms/pinterest");
const { handleYoutube } = require("../platforms/youtube");

//const URL_PATTERN = /\bhttps?:\/\/(www\.)?(instagram\.com|tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|twitter\.com|x\.com|reddit\.com|pinterest\.com|douyin\.com)\S+/gi;
const URL_PATTERN = /\bhttps?:\/\/(www\.)?(instagram\.com|tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com|twitter\.com|x\.com|reddit\.com|pinterest\.com|douyin\.com|youtube\.com\/shorts)\S+/gi;

async function getServerUploadLimit(client, guildId) {
    const guild = await client.guilds.fetch(guildId);
    const tier = guild.premiumTier;

    switch (tier) {
        case 0:
        case 1:
            return 10;
        case 2:
            return 50;
        case 3:
            return 100;
        default:
            return 8;
    }
}

function parseMediaIndex(content) {
    const match = content.match(/(?:^|\s)\b([1-9]\d?|sve|all)\b/i);
    if (!match) {
        return ["nema"];
    }
    return match;
}

async function handleMessage(msg, client) {
    // Ignore bot messages
    if (msg.author.bot) {
        return;
    }

    // Check for supported URLs
    const urls = msg.content.match(URL_PATTERN);
    if (!urls || urls.length === 0) {
        return;
    }

    const url = urls[0];
    const velicina = await getServerUploadLimit(client, msg.guildId);
    const match = parseMediaIndex(msg.content);
    const author = msg.author.id;

    console.log(`Processing URL: ${url}`);
    console.log(`Upload limit: ${velicina}MB`);

    try {
        if (url.includes("instagram")) {
            await handleInstagram(msg, url, author, velicina, match);
        } else if (url.includes("tiktok") || url.includes("douyin")) {
            await handleTikTok(msg, url, author, velicina);
        } else if (url.includes("twitter")) {
            await handleTwitter(msg, url, author, velicina);
        } else if (url.includes("x.com")) {
            await handleTwitter(msg, url, author, velicina);
        } else if (url.includes("reddit.com")) {
            await handleReddit(msg, url, author, velicina);
        } else if (url.includes("pinterest.com")) {
            await handlePinterest(msg, url, author, velicina);
        }
    } catch (error) {
        console.error("Error handling message:", error);
    }
}

module.exports = {
    handleMessage
};
