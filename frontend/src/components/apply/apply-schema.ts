import { z } from "zod"
import {
  applicationDocumentPdfSizeLimitMessage,
  documentFileNameMatches,
  documentFileNameFormatMessage,
  formatContactDigits,
  isApplicationDocumentPdfWithinSizeLimit,
  isValidContactNumber,
  isValidFacebookUrl,
  isValidGithubUrl,
  isValidGoogleDriveUrl,
  isValidSection,
  isValidStudentNumber,
} from "@/lib/apply-field-validation"
import { isApplicantGender } from "@/lib/applicant-gender"
import { needsCreativesPortfolio, needsDevelopmentGithub } from "@/lib/committee-apply"
import { isValidBirthdayYmd } from "@/lib/date-local"

const FILE_ERROR = "Please attach your Curriculum Vitae, Transcript of Records, and Registration Form."
const PDF_ERROR = "Please attach all three files as PDFs (.pdf), then try again."
const nameIsValid = (value: string) =>
  Boolean(value.trim()) && value.trim().length <= 100 && /^[\p{L}\s'-]+$/u.test(value.trim())

const fileSchema = z.custom<File | null>(
  (value) =>
    value === null ||
    (typeof File !== "undefined" && value instanceof File),
  { error: FILE_ERROR }
)

export const privacySchema = z.object({
  dataPrivacyAgreed: z.boolean(),
})

export const generalInfoSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  age: z.string(),
  birthday: z.string(),
  gender: z.string(),
  section: z.string(),
  emailLocal: z.string(),
  studentNumber: z.string(),
  contactDigits: z.string(),
  facebookUrl: z.string(),
})

export const committeeSchema = z.object({
  firstCommittee: z.string(),
  firstPositionId: z.string(),
  secondCommittee: z.string(),
  secondPositionId: z.string(),
  motivation: z.string(),
  slotId: z.string(),
  portfolioUrl: z.string(),
  githubUrl: z.string(),
})

export const uploadSchema = z.object({
  resume: fileSchema,
  transcript: fileSchema,
  registration: fileSchema,
  resumeDisplayName: z.string().optional(),
  transcriptDisplayName: z.string().optional(),
  registrationDisplayName: z.string().optional(),
})

export const applySchema = z
  .object({
    privacy: privacySchema,
    general: generalInfoSchema,
    committee: committeeSchema,
    upload: uploadSchema,
  })
  .superRefine((value, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message })

    if (!value.privacy.dataPrivacyAgreed) {
      issue(["privacy", "dataPrivacyAgreed"], "You must agree to the Data Privacy Agreement to continue.")
    }
    if (!nameIsValid(value.general.firstName)) {
      issue(["general", "firstName"], "Please use letters only for your name so we can match it to your application.")
    }
    if (!nameIsValid(value.general.lastName)) {
      issue(["general", "lastName"], "Please use letters only for your name so we can match it to your application.")
    }
    const age = Number(value.general.age)
    if (!Number.isInteger(age) || age <= 0) {
      issue(["general", "age"], "Age must be a positive number so we can confirm your eligibility for R101.")
    }
    if (!isValidBirthdayYmd(value.general.birthday)) {
      issue(["general", "birthday"], "Pick a valid birthday that is not in the future.")
    }
    if (!isApplicantGender(value.general.gender)) {
      issue(["general", "gender"], "Select your gender.")
    }
    if (!isValidSection(value.general.section)) {
      issue(["general", "section"], "Year & section must be four characters (e.g. 4CSC).")
    }
    if (!value.general.emailLocal.trim()) {
      issue(["general", "emailLocal"], "Please enter your UST email address.")
    }
    if (!isValidStudentNumber(value.general.studentNumber)) {
      issue(["general", "studentNumber"], "Student number must be exactly 10 digits.")
    }
    if (!isValidContactNumber(formatContactDigits(value.general.contactDigits))) {
      issue(["general", "contactDigits"], "Contact number must be +63 followed by 10 digits.")
    }
    if (!isValidFacebookUrl(value.general.facebookUrl)) {
      issue(["general", "facebookUrl"], "Enter a valid https Facebook profile link.")
    }

    const { committee } = value
    if (!committee.firstPositionId) issue(["committee", "firstPositionId"], "Please select your first choice.")
    if (!committee.secondPositionId) issue(["committee", "secondPositionId"], "Please select your second choice.")
    if (committee.firstPositionId && committee.firstPositionId === committee.secondPositionId) {
      issue(["committee", "secondPositionId"], "Pick two different positions so we can rank your committee preferences.")
    }
    if (!committee.slotId) issue(["committee", "slotId"], "Pick an interview time slot for your first-choice committee.")
    if (!committee.motivation.trim()) issue(["committee", "motivation"], "Please complete all the required fields.")
    const needsPortfolio = needsCreativesPortfolio(committee.firstCommittee, committee.secondCommittee)
    const needsGithub = needsDevelopmentGithub(committee.firstCommittee, committee.secondCommittee)
    if (needsPortfolio && !committee.portfolioUrl.trim()) {
      issue(["committee", "portfolioUrl"], "Add your Google Drive portfolio link for your Creatives committee choice.")
    } else if (needsPortfolio && !isValidGoogleDriveUrl(committee.portfolioUrl)) {
      issue(["committee", "portfolioUrl"], "Use a Google Drive or Docs share link (drive.google.com/file/d/… or docs.google.com/document/d/…).")
    }
    if (needsGithub && committee.githubUrl.trim() && !isValidGithubUrl(committee.githubUrl)) {
      issue(["committee", "githubUrl"], "Use your GitHub profile link only (https://github.com/username), not a repository URL.")
    }

    for (const type of ["resume", "transcript", "registration"] as const) {
      const file = value.upload[type]
      if (!file) {
        issue(["upload", type], FILE_ERROR)
      } else if (file.type !== "application/pdf") {
        issue(["upload", type], PDF_ERROR)
      } else if (!isApplicationDocumentPdfWithinSizeLimit(file)) {
        issue(["upload", type], applicationDocumentPdfSizeLimitMessage())
      } else if (!documentFileNameMatches(type, file.name, value.general.lastName)) {
        issue(["upload", type], documentFileNameFormatMessage())
      }
    }
  })

export const applyFormDefaults: ApplyFormValues = {
  privacy: { dataPrivacyAgreed: false },
  general: {
    firstName: "", lastName: "", age: "", birthday: "", gender: "", section: "",
    emailLocal: "", studentNumber: "", contactDigits: "", facebookUrl: "",
  },
  committee: {
    firstCommittee: "", firstPositionId: "", secondCommittee: "", secondPositionId: "",
    motivation: "", slotId: "", portfolioUrl: "", githubUrl: "",
  },
  upload: { resume: null, transcript: null, registration: null },
}

export type PrivacyValues = z.infer<typeof privacySchema>
export type GeneralInfoValues = z.infer<typeof generalInfoSchema>
export type CommitteeValues = z.infer<typeof committeeSchema>
export type UploadValues = z.infer<typeof uploadSchema>
export type ApplyFormValues = z.infer<typeof applySchema>

export const applyFormDraftSchema = z.object({
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  privacy: privacySchema.default(applyFormDefaults.privacy),
  general: generalInfoSchema.extend({
    birthday: z.string().default(""), gender: z.string().default(""), studentNumber: z.string().default(""),
    contactDigits: z.string().default(""), facebookUrl: z.string().default(""),
  }),
  committee: committeeSchema.extend({
    slotId: z.string().default(""), portfolioUrl: z.string().default(""), githubUrl: z.string().default(""),
  }),
  upload: z.object({
    resumeDisplayName: z.string().optional(),
    transcriptDisplayName: z.string().optional(),
    registrationDisplayName: z.string().optional(),
  }),
})

export type ApplyFormDraft = z.infer<typeof applyFormDraftSchema>
