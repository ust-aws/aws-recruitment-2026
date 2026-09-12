import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db";
import { applicationDocuments, uploadSessions } from "../db/schema";
import {
  createDocumentUpload,
  type DocumentType,
} from "../lib/documents";
import { uploadPresignSchema } from "../lib/apply-schemas";
import { uploadsAreClosed } from "../lib/free-plan";

const UPLOAD_EXPIRY_SECONDS = 10 * 60;
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const STORAGE_CAP_BYTES = 4_000_000_000;
const SESSION_CAP = 200;

type UploadDocument = {
  documentType: DocumentType;
  fileName: string;
  sizeBytes: number;
  checksumSha256: string;
};

class UploadError extends Error {
  constructor(readonly status: 400 | 403 | 409, message: string) {
    super(message);
  }
}

function parseBody(body: unknown): UploadDocument[] {
  const result = uploadPresignSchema.safeParse(body);
  if (!result.success) throw new UploadError(400, result.error.issues[0].message);
  return result.data.documents;
}

function numeric(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function createUploadSession(documents: UploadDocument[]) {
  const resume = documents.find((document) => document.documentType === "resume")!;
  const transcript = documents.find((document) => document.documentType === "transcript")!;
  const registration = documents.find((document) => document.documentType === "registration")!;
  const now = new Date();
  const uploadExpiresAt = new Date(now.getTime() + UPLOAD_EXPIRY_SECONDS * 1000);
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_MS);
  const [session] = await db.transaction(async (tx) => {
    await tx.execute(sql`LOCK TABLE "upload_sessions", "application_documents" IN SHARE ROW EXCLUSIVE MODE`);
    await tx.update(uploadSessions).set({ status: "expired" }).where(and(eq(uploadSessions.status, "active"), lt(uploadSessions.expiresAt, now)));
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(uploadSessions).where(inArray(uploadSessions.status, ["active", "consumed"]));
    if (numeric(count) >= SESSION_CAP) throw new UploadError(409, "The application upload-session cap has been reached.");
    const [{ committedBytes }] = await tx.select({ committedBytes: sql<number>`coalesce(sum(${applicationDocuments.fileSizeBytes}), 0)::bigint` }).from(applicationDocuments);
    const [{ reservedBytes }] = await tx.select({ reservedBytes: sql<number>`coalesce(sum(${uploadSessions.resumeSizeBytes} + ${uploadSessions.transcriptSizeBytes} + ${uploadSessions.registrationSizeBytes}), 0)::bigint` }).from(uploadSessions).where(and(eq(uploadSessions.status, "active"), gt(uploadSessions.expiresAt, now)));
    if (numeric(committedBytes) + numeric(reservedBytes) + resume.sizeBytes + transcript.sizeBytes + registration.sizeBytes > STORAGE_CAP_BYTES) {
      throw new UploadError(409, "The document storage cap has been reached.");
    }
    return tx.insert(uploadSessions).values({
      resumeFileName: resume.fileName,
      resumeSizeBytes: resume.sizeBytes,
      resumeChecksumSha256: resume.checksumSha256,
      transcriptFileName: transcript.fileName,
      transcriptSizeBytes: transcript.sizeBytes,
      transcriptChecksumSha256: transcript.checksumSha256,
      registrationFileName: registration.fileName,
      registrationSizeBytes: registration.sizeBytes,
      registrationChecksumSha256: registration.checksumSha256,
      uploadExpiresAt,
      expiresAt,
    }).returning({ id: uploadSessions.id });
  });
  const uploads = await Promise.all(documents.map(async (document) => ({
    documentType: document.documentType,
    ...(await createDocumentUpload(session.id, document, UPLOAD_EXPIRY_SECONDS)),
  })));
  return { uploadSessionId: session.id, uploadExpiresAt: uploadExpiresAt.toISOString(), sessionExpiresAt: expiresAt.toISOString(), uploads };
}

export const uploadsRoutes = new Hono();

uploadsRoutes.post("/presign", async (c) => {
  if (uploadsAreClosed()) return c.json({ error: "Uploads are closed during the final seven days of the AWS Free Plan." }, 403);
  try {
    return c.json(await createUploadSession(parseBody(await c.req.json().catch(() => null))), 201);
  } catch (error) {
    if (error instanceof UploadError) return c.json({ error: error.message }, error.status);
    console.error("Could not create upload session", error);
    return c.json({ error: "Could not create an upload session." }, 503);
  }
});
