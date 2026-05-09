import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/services/r2-delete";

const BUCKET = process.env.R2_BUCKET_NAME || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");

export async function uploadVideoSegment(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  const cacheControl = key.endsWith(".ts")
    ? "public, max-age=31536000"
    : "public, max-age=300";

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );

  return `${CDN_URL}/${key}`;
}
