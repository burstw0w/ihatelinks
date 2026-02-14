const puppeteer = require("puppeteer");
const config = require("../config");
const { downloadVideo } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

async function getPinterestVideoUrl(pinterestUrl) {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        executablePath: config.paths.chromium,
    });
    const page = await browser.newPage();
    let videoSrc = null;

    try {
        const url = "https://ptsave.com/info?url=" + pinterestUrl;
        await page.goto(url);

        // Check if error message appears
        const errorMessage = await page.$eval("div.text-xl", el => el.textContent.trim());
        if (errorMessage.includes("Sorry, we could not find any video on this Pin.")) {
            console.log("Video not found on Pin.");
            return null;
        }

        // Wait for the video element to load
        await page.waitForSelector("video.h-80");

        // Get the src attribute of the video element
        videoSrc = await page.$eval("video.h-80", el => el.getAttribute("src"));
    } catch (error) {
        console.error("Error fetching Pinterest video:", error);
    } finally {
        await browser.close();
        return videoSrc;
    }
}

async function handlePinterest(msg, url, author, velicina) {
    console.log("Processing Pinterest URL:", url);

    try {
        const media = await getPinterestVideoUrl(url);

        if (!media || !media.includes("pinimg.com/videos/")) {
            console.log("No valid Pinterest video found");
            return null;
        }

        const fname = "pint" + generateRandomString() + ".mp4";
        await downloadVideo(media, fname);
        
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
        console.error("Error processing Pinterest:", error);
        return null;
    }
}

module.exports = {
    handlePinterest
};
