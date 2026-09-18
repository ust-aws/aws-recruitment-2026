import type { DocumentType } from "@/lib/types/application"
import type { UploadPresignResponse } from "@/lib/api/client"

export type UploadableDocument = {
  documentType: DocumentType
  file: File
}

export type UploadDocumentMetadata = {
  documentType: DocumentType
  fileName: string
  sizeBytes: number
  checksumSha256: string
}

function toBase64(bytes: ArrayBuffer): string {
  const chunk = 0x8000
  const view = new Uint8Array(bytes)
  let binary = ""
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function fileChecksum(file: File): Promise<string> {
  return toBase64(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()))
}

export async function documentUploadMetadata(
  files: UploadableDocument[],
): Promise<UploadDocumentMetadata[]> {
  return Promise.all(
    files.map(async ({ documentType, file }) => ({
      documentType,
      fileName: file.name,
      sizeBytes: file.size,
      checksumSha256: await fileChecksum(file),
    })),
  )
}

export async function uploadDocumentFiles(
  files: UploadableDocument[],
  session: UploadPresignResponse,
): Promise<void> {
  await Promise.all(
    session.uploads.map(async (signedUpload) => {
      const match = files.find(
        (candidate) => candidate.documentType === signedUpload.documentType,
      )
      if (!match) {
        throw new Error(
          `Missing upload file for document type "${signedUpload.documentType}".`,
        )
      }
      const form = new FormData()
      Object.entries(signedUpload.fields).forEach(([name, value]) =>
        form.append(name, value),
      )
      form.append("file", match.file)
      const response = await fetch(signedUpload.url, { method: "POST", body: form })
      if (!response.ok) {
        throw new Error("Could not upload the PDF files.")
      }
    }),
  )
}
