import type { DocumentType } from "@/lib/types/application"

const SECTION_RE = /^[1-6][A-Z]{3}$/
const STUDENT_NUMBER_RE = /^\d{10}$/
const CONTACT_RE = /^\+63\d{10}$/

export function sanitizeSectionInput(value: string): string {
  return value
    .replace(/[^0-9A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 4)
}

export function isValidSection(value: string): boolean {
  return SECTION_RE.test(value.trim().toUpperCase())
}

export function isValidStudentNumber(value: string): boolean {
  return STUDENT_NUMBER_RE.test(value.trim())
}

export function formatContactDigits(digits: string): string {
  const only = digits.replace(/\D/g, "").slice(0, 10)
  return only ? `+63${only}` : ""
}

export function isValidContactNumber(value: string): boolean {
  return CONTACT_RE.test(value.trim())
}

export function isValidFacebookUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== "https:") return false
    const host = url.hostname.replace(/^www\./, "")
    return (
      host === "facebook.com" ||
      host === "fb.com" ||
      host.endsWith(".facebook.com")
    )
  } catch {
    return false
  }
}

export const GOOGLE_DRIVE_URL_EXAMPLE =
  "https://drive.google.com/file/d/abc123/view?usp=sharing"

export const GITHUB_PROFILE_URL_EXAMPLE = "https://github.com/your-username"

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/

function parseHttpsUrl(value: string): URL | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const url = new URL(href)
    if (url.protocol !== "https:") return null
    return url
  } catch {
    return null
  }
}

export function isValidGoogleDriveUrl(value: string): boolean {
  const url = parseHttpsUrl(value)
  if (!url) return false
  const host = url.hostname.replace(/^www\./, "")

  if (host === "drive.google.com") {
    return (
      /^\/file\/d\/[^/]+/.test(url.pathname) ||
      (url.pathname === "/open" && Boolean(url.searchParams.get("id"))) ||
      /^\/drive\/folders\/[^/]+/.test(url.pathname)
    )
  }

  if (host === "docs.google.com") {
    return /^\/(document|presentation|spreadsheets|drawings)\/d\/[^/]+/.test(
      url.pathname
    )
  }

  return false
}

export function isValidGithubUrl(value: string): boolean {
  const url = parseHttpsUrl(value)
  if (!url) return false
  const host = url.hostname.replace(/^www\./, "")
  if (host !== "github.com") return false

  const segments = url.pathname.split("/").filter(Boolean)
  if (segments.length !== 1) return false

  return GITHUB_USERNAME_RE.test(segments[0])
}

export const googleDriveUrlFormatError =
  "Use a Google Drive or Docs share link (drive.google.com/file/d/… or docs.google.com/document/d/…)."

export const githubProfileUrlFormatError =
  "Use your GitHub profile link only (https://github.com/username), not a repository URL."

export function lastNameFileToken(lastName: string): string {
  return lastName
    .replace(/\s+/g, "")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase()
}

export function expectedDocumentFileName(
  documentType: DocumentType,
  lastName: string
): string {
  const token = lastNameFileToken(lastName)
  const prefix = documentType === "resume" ? "CV" : "RegForm"
  return `${prefix}_${token}.pdf`
}

const DOCUMENT_FILE_PREFIX: Record<DocumentType, string> = {
  resume: "CV",
  registration: "RegForm",
}

export const documentLastNamePlaceholder = "Lastname"

export const APPLICATION_DOCUMENT_PDF_MAX_BYTES = 10_000_000

export const APPLICATION_DOCUMENT_PDF_MAX_SIZE_LABEL = "10 MB"

export function isApplicationDocumentPdfWithinSizeLimit(file: File): boolean {
  return file.size <= APPLICATION_DOCUMENT_PDF_MAX_BYTES
}

export function applicationDocumentPdfSizeLimitMessage(): string {
  return `Each PDF must be ${APPLICATION_DOCUMENT_PDF_MAX_SIZE_LABEL} or smaller.`
}

export function documentUploadFileHint(documentType: DocumentType): string {
  return `Save your PDF as ${documentFileNameFormatExample(documentType)}. Maximum file size: ${APPLICATION_DOCUMENT_PDF_MAX_SIZE_LABEL}.`
}

export function documentFileNameFormatExample(documentType: DocumentType): string {
  return `${DOCUMENT_FILE_PREFIX[documentType]}_${documentLastNamePlaceholder}.pdf`
}

export function documentFileNameFormatMessage(): string {
  return `Name each PDF exactly: ${documentFileNameFormatExample("resume")} and ${documentFileNameFormatExample("registration")}.`
}

export function documentFileNameMatches(
  documentType: DocumentType,
  fileName: string,
  lastName: string
): boolean {
  const expected = expectedDocumentFileName(documentType, lastName)
  return fileName.trim().toLowerCase() === expected.toLowerCase()
}
