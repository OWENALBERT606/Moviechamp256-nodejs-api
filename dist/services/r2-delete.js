"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.r2 = void 0;
exports.extractR2Key = extractR2Key;
exports.deleteR2File = deleteR2File;
exports.deleteR2Files = deleteR2Files;
exports.deleteR2Folder = deleteR2Folder;
const client_s3_1 = require("@aws-sdk/client-s3");
exports.r2 = new client_s3_1.S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});
const BUCKET = process.env.R2_BUCKET_NAME || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");
function extractR2Key(url) {
    if (!url)
        return null;
    try {
        if (CDN_URL && url.startsWith(CDN_URL + "/")) {
            return decodeURIComponent(url.slice(CDN_URL.length + 1));
        }
        const parsed = new URL(url);
        if (parsed.hostname.endsWith("r2.dev") || parsed.hostname.endsWith("cloudflarestorage.com")) {
            return decodeURIComponent(parsed.pathname.slice(1));
        }
        console.warn(`[r2-delete] Unrecognised URL: ${url}`);
        return null;
    }
    catch (_a) {
        console.warn(`[r2-delete] Invalid URL: ${url}`);
        return null;
    }
}
function deleteR2File(url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!BUCKET) {
            console.error("[r2-delete] R2_BUCKET_NAME is not configured");
            return;
        }
        const key = extractR2Key(url);
        if (!key)
            return;
        try {
            yield exports.r2.send(new client_s3_1.DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
            console.log(`[r2-delete] Deleted: ${key}`);
        }
        catch (e) {
            console.error(`[r2-delete] Failed to delete "${key}":`, e.message);
        }
    });
}
function deleteR2Files(urls) {
    return __awaiter(this, void 0, void 0, function* () {
        const valid = urls.filter((u) => !!u);
        if (valid.length === 0)
            return;
        yield Promise.allSettled(valid.map(deleteR2File));
    });
}
function deleteR2Folder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (!BUCKET || !prefix)
            return;
        let continuationToken;
        do {
            const list = yield exports.r2.send(new client_s3_1.ListObjectsV2Command({
                Bucket: BUCKET,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));
            const objects = (_b = (_a = list.Contents) === null || _a === void 0 ? void 0 : _a.map((o) => ({ Key: o.Key }))) !== null && _b !== void 0 ? _b : [];
            if (objects.length > 0) {
                yield exports.r2.send(new client_s3_1.DeleteObjectsCommand({
                    Bucket: BUCKET,
                    Delete: { Objects: objects, Quiet: true },
                }));
                console.log(`[r2-delete] Deleted ${objects.length} objects under prefix "${prefix}"`);
            }
            continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
        } while (continuationToken);
    });
}
