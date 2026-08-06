import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

export function getAttachmentLimits() {
  return {
    maxBytes: MAX_BYTES,
    allowedMimeTypes: [...ALLOWED_MIME_TYPES],
  };
}

export function assertAllowedAttachment(mimeType: string, sizeBytes: number) {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error("File type is not allowed.");
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    throw new Error("File must be between 1 byte and 25 MB.");
  }
}

function getR2Client() {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket() {
  return process.env.R2_BUCKET!;
}

export function buildObjectKey(params: {
  taskId: string;
  attachmentId: string;
  fileName: string;
}) {
  const safeName = params.fileName
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return `tasks/${params.taskId}/${params.attachmentId}/${safeName || "file"}`;
}

export async function createUploadUrl(params: {
  objectKey: string;
  mimeType: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: params.objectKey,
    ContentType: params.mimeType,
  });
  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60 * 5,
  });
}

export async function createDownloadUrl(params: {
  objectKey: string;
  fileName: string;
  expiresInSeconds?: number;
}) {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: params.objectKey,
    ResponseContentDisposition: `attachment; filename="${params.fileName.replace(/"/g, "")}"`,
  });
  return getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds ?? 60 * 5,
  });
}

export async function deleteObject(objectKey: string) {
  if (!isR2Configured()) return;
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: objectKey,
    }),
  );
}
