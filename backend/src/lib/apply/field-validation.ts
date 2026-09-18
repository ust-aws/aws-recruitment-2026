import type { DocumentType, UploadDocumentType } from "../applications/documents";
import {
  type ChoiceRef,
  isCreativesCommittee,
  needsGithubForChoice,
} from "./committee";

const SECTION_RE = /^[1-6][A-Z]{3}$/;
const STUDENT_NUMBER_RE = /^\d{10}$/;
const CONTACT_RE = /^\+63\d{10}$/;

export function normalizeSection(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidSection(value: string): boolean {
  return SECTION_RE.test(normalizeSection(value));
}

export function isValidStudentNumber(value: string): boolean {
  return STUDENT_NUMBER_RE.test(value.trim());
}

export function isValidContactNumber(value: string): boolean {
  return CONTACT_RE.test(value.trim());
}

export function isValidFacebookUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.replace(/^www\./, "");
    return host === "facebook.com" || host === "fb.com" || host.endsWith(".facebook.com");
  } catch {
    return false;
  }
}

const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

function parseHttpsUrl(value: string): URL | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(href);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function isValidGoogleDriveUrl(value: string): boolean {
  const url = parseHttpsUrl(value);
  if (!url) return false;
  const host = url.hostname.replace(/^www\./, "");

  if (host === "drive.google.com") {
    return (
      /^\/file\/d\/[^/]+/.test(url.pathname) ||
      (url.pathname === "/open" && Boolean(url.searchParams.get("id"))) ||
      /^\/drive\/folders\/[^/]+/.test(url.pathname)
    );
  }

  if (host === "docs.google.com") {
    return /^\/(document|presentation|spreadsheets|drawings)\/d\/[^/]+/.test(
      url.pathname,
    );
  }

  return false;
}

export function isValidGithubUrl(value: string): boolean {
  const url = parseHttpsUrl(value);
  if (!url) return false;
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "github.com") return false;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return false;

  return GITHUB_USERNAME_RE.test(segments[0]);
}

const APPLICANT_NAME_RE = /^[\p{L}\s'-]+$/u;
const MOTIVATION_MAX_LENGTH = 4000;
export function isValidApplicantName(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length > 0 &&
    trimmed.length <= 100 &&
    APPLICANT_NAME_RE.test(trimmed) &&
    !/\d/.test(trimmed)
  );
}

export function isValidUstApplicantEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@ust\.edu\.ph$/i.test(email);
}

export function isValidMotivation(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MOTIVATION_MAX_LENGTH) return false;
  return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(trimmed);
}

export function lastNameFileToken(lastName: string): string {
  return lastName
    .replace(/\s+/g, "")
    .replace(/[^\p{L}]/gu, "")
    .toLowerCase();
}

export function hasValidLastNameFileToken(lastName: string): boolean {
  return lastNameFileToken(lastName).length > 0;
}

export function expectedDocumentFileName(
  documentType: DocumentType,
  lastName: string,
): string {
  const token = lastNameFileToken(lastName);
  const prefix =
    documentType === "resume"
      ? "CV"
      : documentType === "transcript"
        ? "TOR"
        : "RegForm";
  return `${prefix}_${token}.pdf`;
}

export function documentFileNameMatches(
  documentType: DocumentType,
  fileName: string,
  lastName: string,
): boolean {
  if (!hasValidLastNameFileToken(lastName)) return false;
  const expected = expectedDocumentFileName(documentType, lastName);
  return fileName.trim().toLowerCase() === expected.toLowerCase();
}

export function canonicalizeHttpsUrl(value: string): string | null {
  const url = parseHttpsUrl(value);
  if (!url) return null;
  return url.href;
}

const REQUIRED_DOCUMENT_TYPES: UploadDocumentType[] = [
  "resume",
  "registration",
];

function normalizeChoiceRefs(
  choices: string[] | ChoiceRef[],
): ChoiceRef[] {
  return choices.map((choice) =>
    typeof choice === "string"
      ? { committee: choice, title: "" }
      : choice,
  );
}

export function validateChoiceUrls(
  choices: string[] | ChoiceRef[],
  portfolioUrl: string | null | undefined,
  githubUrl: string | null | undefined,
): string | null {
  const refs = normalizeChoiceRefs(choices);
  const needsPortfolio = refs.some((choice) =>
    isCreativesCommittee(choice.committee),
  );
  const needsGithub = refs.some((choice) =>
    needsGithubForChoice(choice.committee, choice.title),
  );

  const portfolio = portfolioUrl?.trim() ?? "";
  const github = githubUrl?.trim() ?? "";

  if (needsPortfolio) {
    if (!portfolio || !isValidGoogleDriveUrl(portfolio)) {
      return "portfolioUrl must be a Google Drive or Docs share link (for example drive.google.com/file/d/… or docs.google.com/document/d/…).";
    }
  } else if (portfolio) {
    return "portfolioUrl is only required for Creatives committee choices.";
  }

  if (github && !isValidGithubUrl(github)) {
    return "githubUrl must be a GitHub profile link (https://github.com/username), not a repository URL.";
  }
  if (github && !needsGithub) {
    return "githubUrl is only used when applying to the Development Committee or as Executive Assistant to the CTO.";
  }

  return null;
}

export { REQUIRED_DOCUMENT_TYPES };
