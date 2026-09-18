import { getApplicationDocument } from "../applications/applications";
import { fetchObjectBytes } from "../applications/documents";
import type { EmailFileAttachment } from "./types";

export async function loadOfficerApplicantAttachments(
  applicationId: string,
): Promise<EmailFileAttachment[]> {
  const attachments: EmailFileAttachment[] = [];

  for (const type of ["resume", "registration"] as const) {
    const meta = await getApplicationDocument(applicationId, type);
    if (!meta?.s3Key) {
      console.info(
        `[email] missing ${type} for application ${applicationId}; sending notice without it`,
      );
      continue;
    }
    const bytes = await fetchObjectBytes(meta.s3Key);
    if (!bytes) {
      console.info(
        `[email] could not load ${type} from S3 for application ${applicationId}`,
      );
      continue;
    }
    attachments.push({
      filename: meta.fileName,
      mimeType: "application/pdf",
      content: bytes,
    });
  }

  return attachments;
}
