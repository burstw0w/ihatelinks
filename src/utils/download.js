const axios = require("axios");
const fs = require("fs");

async function downloadVideo(videoUrl, fileName) {
    try {
        const response = await axios({
            method: "get",
            url: videoUrl,
            responseType: "stream",
        });

        const writer = fs.createWriteStream(fileName);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (error) {
        console.error("Error downloading video:", error);
        throw error;
    }
}

async function downloadImage(imageUrl, fileName) {
    try {
        const response = await axios({
            method: "get",
            url: imageUrl,
            responseType: "stream",
        });

        const writer = fs.createWriteStream(fileName);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    } catch (error) {
        console.error("Error downloading image:", error);
        throw error;
    }
}

async function checkFileType(url) {
    try {
        const headResponse = await axios.head(url);
        const contentType = headResponse.headers["content-type"];

        if (contentType === "image/jpeg") {
            return 1;
        } else if (contentType === "video/mp4") {
            return 0;
        } else {
            throw new Error(`Unsupported file type: ${contentType}`);
        }
    } catch (error) {
        console.error("An error occurred:", error.message);
    }
}

module.exports = {
    downloadVideo,
    downloadImage,
    checkFileType
};
