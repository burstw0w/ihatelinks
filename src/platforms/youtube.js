const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { downloadVideo } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

async function handleYouTube(msg, url, author, velicina) {
    console.log("Processing YouTube Shorts URL:", url);

    try {
        const fname = "yt" + generateRandomString() + ".mp4";
        
        try {
            await exec(`yt-dlp -f "best[height<=720][ext=mp4]" -o "${fname}" "${url}"`);
        } catch (dlError) {
            await exec(`yt-dlp -f "best" -o "${fname}" "${url}"`);
        }

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
        console.error("Error processing YouTube:", error);
        return null;
    }
}

module.exports = {
    handleYouTube
};
