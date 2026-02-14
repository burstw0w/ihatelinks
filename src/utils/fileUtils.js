const fs = require("fs");

function generateRandomString(length = 5) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }

    return randomString;
}

function deleteFileAsync(filePath) {
    fs.unlink(filePath, (error) => {
        if (error) {
            console.error(`Error deleting file ${filePath}:`, error);
        } else {
            console.log(`File ${filePath} deleted successfully.`);
        }
    });
}

function checkFileSize(filePath, sizeInMB) {
    try {
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);

        if (fileSizeInMB < sizeInMB) {
            console.log(`File is under ${sizeInMB}MB. OK`);
            return 1;
        } else {
            console.log(`File is ${sizeInMB}MB or larger.`);
            return 0;
        }
    } catch (error) {
        console.error("Error getting file size:", error);
        return null;
    }
}

module.exports = {
    generateRandomString,
    deleteFileAsync,
    checkFileSize
};
