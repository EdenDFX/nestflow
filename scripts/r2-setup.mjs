/**
 * Verify R2 credentials from env and apply NestFlow browser-upload CORS.
 *
 * Usage (with .env.local loaded):
 *   node --env-file=.env.local scripts/r2-setup.mjs
 *
 * Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

import {
  CreateBucketCommand,
  GetBucketCorsCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET || "nestflow-attachments";
const endpoint =
  process.env.R2_ENDPOINT ||
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

const corsRules = [
  {
    AllowedOrigins: ["http://localhost:3000", "https://tasks.nestbyeden.app"],
    AllowedMethods: ["GET", "PUT", "HEAD"],
    AllowedHeaders: ["Content-Type"],
    MaxAgeSeconds: 3600,
  },
];

function requireEnv() {
  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET", bucket],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
}

function client() {
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
}

async function ensureBucket(s3) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket exists: ${bucket}`);
    return;
  } catch (error) {
    const name = error?.name || error?.Code || "";
    const message = String(error?.message || error);
    if (!/NotFound|NoSuchBucket|404/i.test(`${name} ${message}`)) {
      throw error;
    }
  }

  console.log(`Creating bucket: ${bucket}`);
  await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  console.log(`Bucket created: ${bucket}`);
}

async function applyCors(s3) {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: corsRules },
    }),
  );
  const current = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.log("CORS applied:");
  console.log(JSON.stringify(current.CORSRules ?? [], null, 2));
}

async function main() {
  requireEnv();
  console.log(`Account: ${accountId}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Bucket: ${bucket}`);

  const s3 = client();
  await ensureBucket(s3);
  await applyCors(s3);
  console.log("R2 setup OK. Restart Next.js so isR2Configured() picks up env.");
}

main().catch((error) => {
  console.error("R2 setup failed:");
  console.error(error?.message || error);
  process.exit(1);
});
