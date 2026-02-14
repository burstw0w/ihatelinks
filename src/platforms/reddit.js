const puppeteer = require("puppeteer");
const config = require("../config");
const { downloadVideo } = require("../utils/download");
const { generateRandomString, deleteFileAsync, checkFileSize } = require("../utils/fileUtils");
const { handleVideoCompression } = require("../utils/compression");

async function getRedditVideoUrl(redditUrl) {
    const browser = await puppeteer.launch({
        args: ["--no-sandbox"],
        executablePath: config.paths.chromium,
    });
    const page = await browser.newPage();
    let downloadHref;

    try {
        const url = "https://rapidsave.com/info?url=" + redditUrl;
        await page.goto(url);

        await page.waitForSelector(".downloadbutton");
        downloadHref = await page.$eval(".downloadbutton", (el) =>
            el.getAttribute("href")
        );
    } catch (error) {
        console.error("Error fetching Reddit video:", error);
    } finally {
        await browser.close();
        return downloadHref;
    }
}

async function handleReddit(msg, url, author, velicina) {
    console.log("Processing Reddit URL:", url);

    try {
        const media = await getRedditVideoUrl(url);

        if (!media || !media.includes("sd.rapidsave.com")) {
            console.log("No valid Reddit video found");
            return null;
        }

        const fname = "rd" + generateRandomString() + ".mp4";
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
        console.error("Error processing Reddit:", error);
        return null;
    }
}

module.exports = {
    handleReddit
};
