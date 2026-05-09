import {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || "";
const CDN_URL = (process.env.CLOUDFLARE_CDN_URL || "").replace(/\/$/, "");

export function extractR2Key(url: string | null | undefined): string | null {
  if (!url) return null;
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
  } catch {
    console.warn(`[r2-delete] Invalid URL: ${url}`);
    return null;
  }
}

export async function deleteR2File(url: string | null | undefined): Promise<void> {
  if (!BUCKET) {
    console.error("[r2-delete] R2_BUCKET_NAME is not configured");
    return;
  }
  const key = extractR2Key(url);
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    console.log(`[r2-delete] Deleted: ${key}`);
  } catch (e: any) {
    console.error(`[r2-delete] Failed to delete "${key}":`, e.message);
  }
}

export async function deleteR2Files(urls: (string | null | undefined)[]): Promise<void> {
  const valid = urls.filter((u): u is string => !!u);
  if (valid.length === 0) return;
  await Promise.allSettled(valid.map(deleteR2File));
}

/** Delete all objects under a prefix (folder). */
export async function deleteR2Folder(prefix: string): Promise<void> {
  if (!BUCKET || !prefix) return;
  let continuationToken: string | undefined;
  do {
    const list = await r2.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const objects = list.Contents?.map((o) => ({ Key: o.Key! })) ?? [];
    if (objects.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: objects, Quiet: true },
        })
      );
      console.log(`[r2-delete] Deleted ${objects.length} objects under prefix "${prefix}"`);
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
  } while (continuationToken);
}
