const { tiktokdl } = require("tiktokdl");
const { downloadVideo } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

async function handleTikTok(msg, url, author, velicina) {
    console.log("Processing TikTok URL:", url);

    try {
        const data = await tiktokdl(url);
        console.log("TikTok data:", data);

        if (!data || !data.video) {
            console.error("No video URL found in TikTok response");
            return null;
        }

        const videoUrl = data.video;
        const fname = "ttk" + generateRandomString() + ".mp4";
        
        await downloadVideo(videoUrl, fname);
        
        const result = checkFileSize(fname, velicina);

        if (result === 0) {
            const compressionMsg = await msg.reply({ content: "Превелик фајл, ајд да пробам да компресујем" });
            const { shouldCompress, compressedFilePath } = await handleVideoCompression(fname, velicina);

            if (shouldCompress) {
                const compressedResult = checkFileSize(compressedFilePath, velicina);
                if (compressedResult === 0) {
                    await compressionMsg.delete().catch(err => console.log("Error deleting compression message:", err));
                    await msg.reply({ content: "Фајл је превелик и након компресије јебигони" });
                    deleteFileAsync(fname);
                    deleteFileAsync(compressedFilePath);
                    return;
                }
                
                await msg.channel.send({
                    content: `<@${author}> качи <${url}> (компресовано)`,
                    files: [compressedFilePath],
                }).catch(err => console.log("Error during Export File:", err));
                
                await compressionMsg.delete().catch(err => console.log("Error deleting compression message:", err));
                msg.delete();
                deleteFileAsync(fname);
                deleteFileAsync(compressedFilePath);
                return;
            } else {
                await msg.reply({ content: "Фајл је превелик и за компресију јебигони" });
                deleteFileAsync(fname);
                return;
            }
        }

        await msg.channel.send({
            content: `<@${author}> качи: <${url}>`,
            files: [fname],
        }).catch(err => console.log("Error during Export File:", err));
        
        msg.delete();
        deleteFileAsync(fname);
    } catch (error) {
        console.error("Error processing TikTok:", error);
        return null;
    }
}

module.exports = {
    handleTikTok
};
