/**
 * Zip file utility functions for extracting and processing ZIP archives
 */
const yauzl = require("yauzl");
const { promisify } = require("util");
const fs = require("fs");

/**
 * Extracts files from a ZIP archive contained in an ArrayBuffer
 * @param {ArrayBuffer} zipData - The ZIP file as an ArrayBuffer
 * @returns {Promise<Object>} - Object containing file contents, with filenames as keys
 */
async function extractFilesFromZip(zipData) {
    return new Promise((resolve, reject) => {
        // Convert ArrayBuffer to Buffer for yauzl
        const buffer = Buffer.from(zipData);
        const files = {};

        // Use yauzl to open the zip file from the buffer
        yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(new Error(`Failed to open zip file: ${err.message}`));
                return;
            }

            zipfile.on("entry", (entry) => {
                // Skip directory entries
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry();
                    return;
                }

                // Read the entry
                zipfile.openReadStream(entry, (err, readStream) => {
                    if (err) {
                        zipfile.readEntry();
                        return;
                    }

                    const chunks = [];
                    readStream.on("data", (chunk) => {
                        chunks.push(chunk);
                    });

                    readStream.on("end", () => {
                        const content = Buffer.concat(chunks).toString('utf8');
                        files[entry.fileName] = content;
                        zipfile.readEntry();
                    });

                    readStream.on("error", (err) => {
                        console.error(`Error reading ${entry.fileName}: ${err.message}`);
                        zipfile.readEntry();
                    });
                });
            });

            zipfile.on("end", () => {
                resolve(files);
            });

            zipfile.on("error", (err) => {
                reject(new Error(`Error reading zip file: ${err.message}`));
            });

            // Start reading entries
            zipfile.readEntry();
        });
    });
}

module.exports = {
    extractFilesFromZip
};
