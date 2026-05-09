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
exports.uploadVideoSegment = uploadVideoSegment;
const client_s3_1 = require("@aws-sdk/client-s3");
const r2_delete_1 = require("../services/r2-delete");
const BUCKET = process.env.R2_BUCKET_NAME || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");
function uploadVideoSegment(key, body, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheControl = key.endsWith(".ts")
            ? "public, max-age=31536000"
            : "public, max-age=300";
        yield r2_delete_1.r2.send(new client_s3_1.PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: cacheControl,
        }));
        return `${CDN_URL}/${key}`;
    });
}
