import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const MAX_DOCUMENT_SIZE_BYTES = 10_000_000;
export const DOCUMENT_TYPES = ["resume", "transcript", "registration"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

type UploadDocument = {
  documentType: DocumentType;
  fileName: string;
  sizeBytes: number;
  checksumSha256: string;
};

function configuredBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured.");
  return bucket;
}

function s3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  return new S3Client({
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "us-east-1",
    ...(endpoint ? { endpoint } : {}),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });
}

export function incomingKey(sessionId: string, type: DocumentType): string {
  return `incoming/${sessionId}/${type}.pdf`;
}

export function applicationKey(applicationId: string, type: DocumentType): string {
  return `applications/${applicationId}/${type}.pdf`;
}

export async function createDocumentUpload(
  sessionId: string,
  document: UploadDocument,
  expiresIn: number,
): Promise<{ url: string; fields: Record<string, string> }> {
  const bucket = configuredBucket();
  const key = incomingKey(sessionId, document.documentType);
  return createPresignedPost(s3Client(), {
    Bucket: bucket,
    Key: key,
    Expires: expiresIn,
    Fields: {
      "Content-Type": "application/pdf",
      "x-amz-checksum-algorithm": "SHA256",
      "x-amz-checksum-sha256": document.checksumSha256,
      "x-amz-server-side-encryption": "AES256",
      success_action_status: "204",
    },
    Conditions: [
      ["eq", "$key", key],
      ["eq", "$Content-Type", "application/pdf"],
      ["eq", "$x-amz-checksum-algorithm", "SHA256"],
      ["eq", "$x-amz-checksum-sha256", document.checksumSha256],
      ["eq", "$x-amz-server-side-encryption", "AES256"],
      ["content-length-range", document.sizeBytes, document.sizeBytes],
    ],
  });
}

export async function validateIncomingDocument(
  sessionId: string,
  document: UploadDocument,
): Promise<void> {
  const bucket = configuredBucket();
  const key = incomingKey(sessionId, document.documentType);
  const client = s3Client();
  const head = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key, ChecksumMode: "ENABLED" }),
  );
  if (
    head.ContentLength !== document.sizeBytes ||
    head.ContentType !== "application/pdf" ||
    head.ChecksumSHA256 !== document.checksumSha256
  ) {
    throw new Error("Uploaded document metadata does not match its upload session.");
  }

  const object = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key, Range: "bytes=0-1023" }),
  );
  const bytes = await object.Body?.transformToByteArray();
  if (!bytes || bytes.length < 5 || new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
    throw new Error("Uploaded document is not a PDF file.");
  }
}

export async function copyIncomingDocuments(
  sessionId: string,
  applicationId: string,
): Promise<void> {
  const bucket = configuredBucket();
  const client = s3Client();
  await Promise.all(
    DOCUMENT_TYPES.map((type) =>
      client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: applicationKey(applicationId, type),
          CopySource: `${bucket}/${incomingKey(sessionId, type)}`,
          MetadataDirective: "COPY",
          ServerSideEncryption: "AES256",
        }),
      ),
    ),
  );
}

export async function deleteKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const bucket = configuredBucket();
  await s3Client().send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
}

export async function createDocumentDownload(
  key: string,
  fileName: string,
  disposition: "inline" | "attachment",
): Promise<string> {
  const bucket = configuredBucket();
  await s3Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return getSignedUrl(
    s3Client(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `${disposition}; filename="${sanitizeFileName(fileName)}"`,
      ResponseCacheControl: "no-store",
    }),
    { expiresIn: 60 },
  );
}

export function sanitizeFileName(fileName: string): string {
  const clean = fileName
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  return (clean || "document.pdf").slice(0, 255);
}

export async function deleteAllDocumentObjects(): Promise<void> {
  const bucket = configuredBucket();
  const client = s3Client();
  for (const prefix of ["applications/", "incoming/"]) {
    let token: string | undefined;
    do {
      const page = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
      );
      await deleteKeys((page.Contents ?? []).flatMap((item) => (item.Key ? [item.Key] : [])));
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }
}
