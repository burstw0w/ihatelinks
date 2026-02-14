const { Client, IntentsBitField } = require("discord.js");
const config = require("./config");
const { handleMessage } = require("./handlers/messageHandler");

function createBot() {
    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
    });

    client.on("ready", (c) => {
        console.log(`✅ Bot is online as ${c.user.tag}`);
        console.log(`📊 Serving ${c.guilds.cache.size} servers`);
    });

    client.on("error", (error) => {
        console.error("❌ Discord.js Error:", error);
    });

    client.on("messageCreate", (msg) => {
        handleMessage(msg, client);
    });

    return client;
}

function startBot() {
    const client = createBot();
    client.login(config.discord.token);
    return client;
}

module.exports = {
    createBot,
    startBot
};
