const getTwitterMedia = require("get-twitter-media");
const { downloadVideo } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

async function handleTwitter(msg, url, author, velicina) {
    console.log("Processing Twitter URL:", url);

    try {
        const normalizedUrl = url.replace("x.com", "twitter.com");
        
        const media = await getTwitterMedia(normalizedUrl, {
            buffer: true,
        });

        if (media.type !== "video") {
            console.log("Not a video tweet");
            return null;
        }

        const videoUrl = media.media[0].url;
        const fname = "tw" + generateRandomString() + ".mp4";
        
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
        console.error("Error processing Twitter:", error);
        return null;
    }
}

module.exports = {
    handleTwitter
};
