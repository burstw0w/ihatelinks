const fs = require("fs");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const { deleteFileAsync } = require("./fileUtils");

async function compressVideo(inputFilePath, outputFilePath) {
    try {
        console.log(`Compressing ${inputFilePath} to ${outputFilePath}`);
        await exec(
            `ffmpeg -i "${inputFilePath}" -c:v libx264 -preset veryfast -crf 32 -c:a aac -b:a 96k -vf "scale=iw*0.75:-1" "${outputFilePath}"`
        );
        console.log("Compression completed successfully");
        return true;
    } catch (error) {
        console.error("Error compressing video:", error);
        return false;
    }
}

async function handleVideoCompression(filePath, sizeLimit) {
    try {
        if (!filePath.toLowerCase().endsWith(".mp4")) {
            console.log("Not a video file, skipping compression");
            return { shouldCompress: false, compressedFilePath: filePath };
        }

        if (sizeLimit !== 10) {
            console.log("Size limit is not 10MB, skipping compression");
            return { shouldCompress: false, compressedFilePath: filePath };
        }

        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB >= 40) {
            console.log("File too large (>=40MB), skipping compression");
            return { shouldCompress: false, compressedFilePath: filePath };
        }

        if (fileSizeInMB <= sizeLimit) {
            console.log("File already within size limit, skipping compression");
            return { shouldCompress: false, compressedFilePath: filePath };
        }

        const compressedFilePath = filePath.replace(".mp4", "comp.mp4");
        console.log("Starting video compression");
        const compressionResult = await compressVideo(filePath, compressedFilePath);

        if (compressionResult) {
            const compressedStats = fs.statSync(compressedFilePath);
            const compressedSizeInMB = compressedStats.size / (1024 * 1024);

            if (compressedSizeInMB <= sizeLimit) {
                console.log(`Compression successful, new size: ${compressedSizeInMB.toFixed(2)}MB`);
                return { shouldCompress: true, compressedFilePath: compressedFilePath };
            } else {
                console.log(`Compression didn't reduce size enough (${compressedSizeInMB.toFixed(2)}MB), using original`);
                deleteFileAsync(compressedFilePath);
                return { shouldCompress: false, compressedFilePath: filePath };
            }
        } else {
            console.log("Compression failed, using original file");
            return { shouldCompress: false, compressedFilePath: filePath };
        }
    } catch (error) {
        console.error("Error in handleVideoCompression:", error);
        return { shouldCompress: false, compressedFilePath: filePath };
    }
}

module.exports = {
    compressVideo,
    handleVideoCompression
};
