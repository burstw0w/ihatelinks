const util = require("util");
const exec = util.promisify(require("child_process").exec);
const config = require("../config");
const { downloadVideo, downloadImage, checkFileType } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

const INSTAGRAM_PATTERN = /\bhttps?:\/\/(?:www\.)?instagram\.com\/(?:p|stories|tv|reel|reels)\/[\w-]+(?:\/\S*)?/gi;

function isValidInstagramUrl(url) {
    INSTAGRAM_PATTERN.lastIndex = 0;
    return INSTAGRAM_PATTERN.test(url);
}

async function getInstagramMedia(url) {
    try {
        const { stdout } = await exec(`${config.paths.pythonBinary} ${config.paths.pythonScript} "${url}" "${config.instagram.sessionId}"`);
        const urls = stdout.trim().split("\n").filter(u => u.length > 0);
        return urls.length > 0 ? { url_list: urls } : null;
    } catch (pyError) {
        console.error("gallery-dl failed:", pyError.message);
        return null;
    }
}

async function handleInstagram(msg, url, author, velicina, match) {
    console.log("Processing Instagram URL:", url);
    
    const link = await getInstagramMedia(url);
    
    if (!link || !link.url_list || link.url_list.length === 0) {
        console.error("No media URLs found");
        return null;
    }

    if (match[0] === "nema") {
        return await handleSingleMedia(msg, url, author, velicina, link.url_list[0]);
    }

    if (!isNaN(match[0])) {
        const index = parseInt(match[0]) - 1;
        if (index < link.url_list.length) {
            return await handleSingleMedia(msg, url, author, velicina, link.url_list[index]);
        } else {
            await msg.reply({ content: "Нема снимка са тим бројем." });
            return;
        }
    }

    return await handleMultipleMedia(msg, url, author, velicina, link.url_list);
}

async function handleSingleMedia(msg, originalUrl, author, velicina, mediaUrl) {
    const isLocalFile = mediaUrl.startsWith('/');
    const isVideo = isLocalFile
        ? mediaUrl.endsWith('.mp4')
        : (await checkFileType(mediaUrl) === 0 || mediaUrl.includes("kkinstagram"));
    
    if (isVideo) {
        return await processVideo(msg, originalUrl, author, velicina, mediaUrl);
    } else {
        return await processImage(msg, originalUrl, author, velicina, mediaUrl);
    }
}

async function processVideo(msg, originalUrl, author, velicina, videoUrl) {
    let fname;
    if (videoUrl.startsWith('/')) {
        fname = videoUrl;
    } else {
        fname = "ins" + generateRandomString() + ".mp4";
        await downloadVideo(videoUrl, fname);
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
                content: `<@${author}> качи <${originalUrl}> (компресовано)`,
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
        content: `<@${author}> качи <${originalUrl}>`,
        files: [fname],
    }).catch(err => console.log("Error during Export File:", err));
    
    msg.delete();
    deleteFileAsync(fname);
}

async function processImage(msg, originalUrl, author, velicina, imageUrl) {
    const fname = "ins" + generateRandomString() + ".jpg";
    await downloadImage(imageUrl, fname);
    
    const result = checkFileSize(fname, velicina);
    
    if (result === 0) {
        await msg.reply({ content: "Фајл је превелик јебигони" });
        deleteFileAsync(fname);
        return;
    }

    await msg.channel.send({
        content: `<@${author}> качи <${originalUrl}>`,
        files: [fname],
    }).catch(err => console.log("Error during Export File:", err));
    
    msg.delete();
    deleteFileAsync(fname);
}

async function handleMultipleMedia(msg, originalUrl, author, velicina, urlList) {
    const maxItems = 10;
    let skippedLarge = false;
    const fileList = [];

    for (let i = 0; i < urlList.length && i < maxItems; i++) {
        const mediaUrl = urlList[i];
        const isLocalFile = mediaUrl.startsWith('/');
        const isVideo = isLocalFile ? mediaUrl.endsWith('.mp4') : await checkFileType(mediaUrl) === 0;

        if (isVideo) {
            const fname = isLocalFile ? mediaUrl : "ins" + generateRandomString() + ".mp4";
            if (!isLocalFile) await downloadVideo(mediaUrl, fname);

            if (checkFileSize(fname, velicina) === 0) {
                deleteFileAsync(fname);
                skippedLarge = true;
            } else {
                fileList.push(fname);
            }
        } else {
            const fname = "ins" + generateRandomString() + ".jpg";
            await downloadImage(mediaUrl, fname);

            if (checkFileSize(fname, velicina) === 0) {
                deleteFileAsync(fname);
                skippedLarge = true;
            } else {
                fileList.push(fname);
            }
        }
    }

    if (fileList.length === 0) {
        await msg.reply({ content: "Нисам успео извући ништа из овог поста." });
        return;
    }

    const replyFiles = fileList.map(filename => ({
        attachment: filename,
        name: filename.split("/").pop()
    }));

    const content = skippedLarge
        ? `<@${author}> качи, али неке ствари нису ту јер су превелике <${originalUrl}>`
        : `<@${author}> качи <${originalUrl}>`;

    await msg.channel.send({ content, files: replyFiles });
    msg.delete();

    for (const file of fileList) {
        deleteFileAsync(file);
    }
}

module.exports = {
    handleInstagram,
    isValidInstagramUrl
};
