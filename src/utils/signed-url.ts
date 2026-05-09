import { createHmac } from "crypto";

const SECRET = process.env.CF_URL_SIGNING_SECRET || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");

export function generateSignedUrl(videoPath: string, expiresInSeconds = 3600): string {
  const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const baseUrl = `${CDN_URL}/${videoPath}`;
  const signature = createHmac("sha256", SECRET)
    .update(`${baseUrl}${expiry}`)
    .digest("hex");
  return `${baseUrl}?expiry=${expiry}&sig=${signature}`;
}
