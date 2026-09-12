import { z } from "zod";
import type { CreateApplicationInput } from "./applications";
import {
  canonicalizeHttpsUrl,
  hasValidLastNameFileToken,
  isValidApplicantName,
  isValidContactNumber,
  isValidFacebookUrl,
  isValidMotivation,
  isValidSection,
  isValidStudentNumber,
  isValidUstApplicantEmail,
  normalizeSection,
} from "./apply-field-validation";
import { parseApplicantGender } from "./applicant-gender";
import { DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "./documents";

const REQUIRED_FIELDS_ERROR =
  "firstName, lastName, email, section, studentNumber, contactNumber, facebookUrl, and motivation are required.";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BIRTHDAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const SHA256_BASE64_RE = /^[A-Za-z0-9+/]{43}=$/;

function isValidBirthday(value: string): boolean {
  const trimmed = value.trim();
  if (!BIRTHDAY_RE.test(trimmed)) return false;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

const requiredString = z
  .string({ error: REQUIRED_FIELDS_ERROR })
  .trim()
  .min(1, { error: REQUIRED_FIELDS_ERROR });

const optionalUrl = z
  .preprocess((value) => (typeof value === "string" ? value.trim() : ""), z.string())
  .transform((value) => (value ? value : undefined));

export const createApplicationSchema = z
  .object({
    dataPrivacyAgreed: z.literal(true, {
      error: "dataPrivacyAgreed must be true before submitting.",
    }),
    firstName: requiredString.refine(isValidApplicantName, {
      error: "firstName and lastName must use letters only (max 100 characters).",
    }),
    lastName: requiredString
      .refine(isValidApplicantName, {
        error: "firstName and lastName must use letters only (max 100 characters).",
      })
      .refine((value) => !isValidApplicantName(value) || hasValidLastNameFileToken(value), {
        error: "lastName must include at least one letter for document file names.",
      }),
    email: requiredString
      .transform((value) => value.toLowerCase())
      .refine(isValidUstApplicantEmail, {
        error: "email must be a valid @ust.edu.ph address.",
      }),
    age: z
      .number({ error: "age must be a positive integer." })
      .int({ error: "age must be a positive integer." })
      .positive({ error: "age must be a positive integer." }),
    birthday: z
      .string({ error: "birthday must be a valid date (YYYY-MM-DD) that is not in the future." })
      .trim()
      .refine(isValidBirthday, {
        error: "birthday must be a valid date (YYYY-MM-DD) that is not in the future.",
      }),
    gender: z
      .string({ error: "gender must be one of: male, female." })
      .trim()
      .refine((value) => Boolean(parseApplicantGender(value)), {
        error: "gender must be one of: male, female.",
      })
      .transform((value) => parseApplicantGender(value)!),
    section: requiredString
      .transform(normalizeSection)
      .refine(isValidSection, {
        error: "section must be four characters: year digit plus three letters (e.g. 4CSC).",
      }),
    studentNumber: requiredString.refine(isValidStudentNumber, {
      error: "studentNumber must be exactly 10 digits.",
    }),
    contactNumber: requiredString.refine(isValidContactNumber, {
      error: "contactNumber must be +63 followed by 10 digits.",
    }),
    facebookUrl: requiredString
      .transform(canonicalizeHttpsUrl)
      .refine((value) => Boolean(value && isValidFacebookUrl(value)), {
        error: "facebookUrl must be a valid https Facebook profile link.",
      })
      .transform((value) => value!),
    motivation: requiredString.refine(isValidMotivation, {
      error: "motivation is required and must be at most 4000 characters.",
    }),
    portfolioUrl: optionalUrl,
    githubUrl: optionalUrl,
    choices: z
      .array(
        z.object(
          {
            positionId: z
              .string({ error: "Each choice needs a valid positionId UUID." })
              .trim()
              .refine((value) => UUID_RE.test(value), {
                error: "Each choice needs a valid positionId UUID.",
              }),
            preferenceRank: z.union([z.literal(1), z.literal(2)], {
              error: "preferenceRank must be 1 or 2.",
            }),
          },
          { error: "Each choice must be an object." },
        ),
        { error: "choices must contain exactly two items." },
      )
      .length(2, { error: "choices must contain exactly two items." }),
    uploadSessionId: z
      .string({ error: "uploadSessionId must be a valid UUID." })
      .trim()
      .refine((value) => UUID_RE.test(value), {
        error: "uploadSessionId must be a valid UUID.",
      }),
    slotId: z
      .string({ error: "slotId must be a UUID." })
      .trim()
      .refine((value) => UUID_RE.test(value), { error: "slotId must be a UUID." }),
  }, { error: "Request body must be a JSON object." })
  .superRefine((value, ctx) => {
    const ranks = new Set(value.choices.map((choice) => choice.preferenceRank));
    if (ranks.size !== 2) {
      ctx.addIssue({ code: "custom", message: "choices must include ranks 1 and 2.", path: ["choices"] });
    }
    if (value.choices[0]?.positionId === value.choices[1]?.positionId) {
      ctx.addIssue({ code: "custom", message: "choices must use two different positions.", path: ["choices"] });
    }
  })
  .transform(({ portfolioUrl, githubUrl, ...value }): CreateApplicationInput => ({
    ...value,
    ...(portfolioUrl ? { portfolioUrl } : {}),
    ...(githubUrl ? { githubUrl } : {}),
  }));

const uploadDocumentSchema = z.object({
  documentType: z.enum(DOCUMENT_TYPES, {
    error: "documentType must be resume, transcript, or registration.",
  }),
  fileName: z
    .string({ error: "fileName must be a PDF name with 255 characters or fewer." })
    .trim()
    .refine((value) => Boolean(value) && value.length <= 255 && value.toLowerCase().endsWith(".pdf"), {
      error: "fileName must be a PDF name with 255 characters or fewer.",
    }),
  sizeBytes: z
    .number({ error: `sizeBytes must be from 1 through ${MAX_DOCUMENT_SIZE_BYTES}.` })
    .int({ error: `sizeBytes must be from 1 through ${MAX_DOCUMENT_SIZE_BYTES}.` })
    .min(1, { error: `sizeBytes must be from 1 through ${MAX_DOCUMENT_SIZE_BYTES}.` })
    .max(MAX_DOCUMENT_SIZE_BYTES, { error: `sizeBytes must be from 1 through ${MAX_DOCUMENT_SIZE_BYTES}.` }),
  checksumSha256: z
    .string({ error: "checksumSha256 must be a base64 SHA-256 checksum." })
    .refine((value) => SHA256_BASE64_RE.test(value), {
      error: "checksumSha256 must be a base64 SHA-256 checksum.",
    }),
});

export const uploadPresignSchema = z
  .object({
    documents: z
      .array(uploadDocumentSchema, { error: "documents must contain one resume, one transcript, and one registration form." })
      .length(DOCUMENT_TYPES.length, {
        error: "documents must contain one resume, one transcript, and one registration form.",
      }),
  }, { error: "Request body must be a JSON object." })
  .superRefine((value, ctx) => {
    if (new Set(value.documents.map((document) => document.documentType)).size !== DOCUMENT_TYPES.length) {
      ctx.addIssue({
        code: "custom",
        message: "documents must contain one resume, one transcript, and one registration form.",
        path: ["documents"],
      });
    }
  });
