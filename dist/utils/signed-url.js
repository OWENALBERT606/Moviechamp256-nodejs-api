"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSignedUrl = generateSignedUrl;
const crypto_1 = require("crypto");
const SECRET = process.env.CF_URL_SIGNING_SECRET || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");
function generateSignedUrl(videoPath, expiresInSeconds = 3600) {
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const baseUrl = `${CDN_URL}/${videoPath}`;
    const signature = (0, crypto_1.createHmac)("sha256", SECRET)
        .update(`${baseUrl}${expiry}`)
        .digest("hex");
    return `${baseUrl}?expiry=${expiry}&sig=${signature}`;
}
