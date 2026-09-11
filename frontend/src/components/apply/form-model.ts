import type { GeneralInfoValues } from "@/components/apply/general-info-step"

import type { CommitteeValues } from "@/components/apply/committee-step"

import type { UploadValues } from "@/components/apply/upload-step"

import type { PrivacyValues } from "@/components/apply/privacy-step"

import type { CreateApplicationInput, DocumentType } from "@/lib/application-types"

import {

  documentFileNameMatches,

  documentFileNameFormatMessage,

  formatContactDigits,

  isValidContactNumber,

  isValidFacebookUrl,

  isValidGithubUrl,

  isValidGoogleDriveUrl,
  githubProfileUrlFormatError,
  googleDriveUrlFormatError,

  isValidSection,

  isValidStudentNumber,

  sanitizeSectionInput,

} from "@/lib/apply-field-validation"

import {

  needsCreativesPortfolio,

  needsDevelopmentGithub,

} from "@/lib/committee-apply"

import { isValidBirthdayYmd } from "@/lib/date-local"

import { isApplicantGender } from "@/lib/applicant-gender"



export const emptyPrivacy: PrivacyValues = {

  dataPrivacyAgreed: false,

}



export const emptyGeneral: GeneralInfoValues = {

  firstName: "",

  lastName: "",

  age: "",

  birthday: "",

  gender: "",

  section: "",

  emailLocal: "",

  studentNumber: "",

  contactDigits: "",

  facebookUrl: "",

}



export const emptyCommittee: CommitteeValues = {

  firstCommittee: "",

  firstPositionId: "",

  secondCommittee: "",

  secondPositionId: "",

  motivation: "",

  slotId: "",

  portfolioUrl: "",

  githubUrl: "",

}



export const emptyUpload: UploadValues = {

  resume: null,

  transcript: null,

  registration: null,

}



export function privacyValid(values: PrivacyValues) {

  return values.dataPrivacyAgreed

}

export function generalRequiredFilled(values: GeneralInfoValues) {
  return Boolean(
    values.firstName.trim() &&
      values.lastName.trim() &&
      values.age.trim() &&
      values.birthday.trim() &&
      values.gender.trim() &&
      values.section.trim() &&
      values.emailLocal.trim() &&
      values.studentNumber.trim() &&
      values.contactDigits.trim() &&
      values.facebookUrl.trim()
  )
}

export function generalValid(values: GeneralInfoValues) {

  const age = Number(values.age)

  const nameOk = (value: string) =>

    Boolean(value.trim()) && !/\d/.test(value) && /^[\p{L}\s'-]+$/u.test(value)

  const contactNumber = formatContactDigits(values.contactDigits)



  return Boolean(

    nameOk(values.firstName) &&

      nameOk(values.lastName) &&

      isValidSection(values.section) &&

      values.emailLocal.trim() &&

      Number.isInteger(age) &&

      age > 0 &&

      isValidBirthdayYmd(values.birthday) &&

      isApplicantGender(values.gender) &&

      isValidStudentNumber(values.studentNumber) &&

      isValidContactNumber(contactNumber) &&

      isValidFacebookUrl(values.facebookUrl)

  )

}



export function committeeValid(values: CommitteeValues) {

  const needsPortfolio = needsCreativesPortfolio(

    values.firstCommittee,

    values.secondCommittee

  )

  const portfolioOk =

    !needsPortfolio ||

    (values.portfolioUrl.trim() && isValidGoogleDriveUrl(values.portfolioUrl))

  const githubOk =

    !values.githubUrl.trim() || isValidGithubUrl(values.githubUrl)

  return Boolean(

    values.firstPositionId &&

      values.secondPositionId &&

      values.firstPositionId !== values.secondPositionId &&

      values.motivation.trim() &&

      values.slotId &&

      portfolioOk &&

      githubOk

  )

}

export function committeeRequiredFilled(values: CommitteeValues) {
  const needsPortfolio = needsCreativesPortfolio(
    values.firstCommittee,
    values.secondCommittee,
  )
  if (
    !values.firstCommittee.trim() ||
    !values.firstPositionId ||
    !values.secondCommittee.trim() ||
    !values.secondPositionId ||
    !values.motivation.trim() ||
    !values.slotId
  ) {
    return false
  }
  if (needsPortfolio && !values.portfolioUrl.trim()) {
    return false
  }
  return true
}

export function uploadRequiredFilled(values: UploadValues) {
  return Boolean(values.resume && values.transcript && values.registration)
}

export function privacyStepError() {

  return "You must agree to the Data Privacy Agreement to continue."

}



export function generalStepError(values: GeneralInfoValues) {

  const age = Number(values.age)

  const missing =

    !values.firstName.trim() ||

    !values.lastName.trim() ||

    !values.section.trim() ||

    !values.emailLocal.trim() ||

    !values.age.trim() ||

    !values.birthday.trim() ||

    !values.gender.trim() ||

    !values.studentNumber.trim() ||

    !values.contactDigits.trim() ||

    !values.facebookUrl.trim()

  if (missing) {

    return "Please complete all the required fields."

  }

  if (!isValidStudentNumber(values.studentNumber)) {

    return "Student number must be exactly 10 digits."

  }

  const contactNumber = formatContactDigits(values.contactDigits)

  if (!isValidContactNumber(contactNumber)) {

    return "Contact number must be +63 followed by 10 digits."

  }

  if (!isValidFacebookUrl(values.facebookUrl)) {

    return "Enter a valid https Facebook profile link."

  }

  if (!isValidSection(values.section)) {

    return "Year & section must be four characters (e.g. 4CSC)."

  }

  if (!Number.isInteger(age) || age <= 0) {

    return "Age must be a positive number so we can confirm your eligibility for R101."

  }

  if (!isValidBirthdayYmd(values.birthday)) {

    return "Pick a valid birthday that is not in the future."

  }

  if (!isApplicantGender(values.gender)) {

    return "Select your gender."

  }

  return "Please use letters only for your name so we can match it to your application."

}



export function committeeStepError(values: CommitteeValues) {

  if (

    values.firstPositionId &&

    values.secondPositionId &&

    values.firstPositionId === values.secondPositionId

  ) {

    return "Pick two different positions so we can rank your committee preferences."

  }

  if (needsCreativesPortfolio(values.firstCommittee, values.secondCommittee)) {

    if (!values.portfolioUrl.trim()) {

      return "Add your Google Drive portfolio link for your Creatives committee choice."

    }

    if (!isValidGoogleDriveUrl(values.portfolioUrl)) {

      return googleDriveUrlFormatError

    }

  }

  if (
    needsDevelopmentGithub(values.firstCommittee, values.secondCommittee) &&
    values.githubUrl.trim() &&
    !isValidGithubUrl(values.githubUrl)
  ) {
    return githubProfileUrlFormatError
  }

  if (

    values.firstPositionId &&

    values.secondPositionId &&

    values.motivation.trim() &&

    !values.slotId

  ) {

    return "Pick an interview time slot for your first-choice committee."

  }

  return "Please complete all the required fields."

}



export const uploadStepError =

  "Please attach your Curriculum Vitae, Transcript of Records, and Registration Form."



export const uploadPdfStepError =

  "Please attach all three files as PDFs (.pdf), then try again."



export function uploadFileNameError() {
  return documentFileNameFormatMessage()
}



export function uploadValid(values: UploadValues, lastName: string) {

  if (!values.resume || !values.transcript || !values.registration) {

    return false

  }

  if (

    values.resume.type !== "application/pdf" ||

    values.transcript.type !== "application/pdf" ||

    values.registration.type !== "application/pdf"

  ) {

    return false

  }

  return (

    documentFileNameMatches("resume", values.resume.name, lastName) &&

    documentFileNameMatches("transcript", values.transcript.name, lastName) &&

    documentFileNameMatches("registration", values.registration.name, lastName)

  )

}



export function toCreateApplicationInput(

  privacy: PrivacyValues,

  general: GeneralInfoValues,

  committee: CommitteeValues,

  upload: UploadValues,

  emailDomain: string

): Omit<CreateApplicationInput, "documents"> & {

  documents: { documentType: DocumentType; fileName: string }[]

} {

  const contactNumber = formatContactDigits(general.contactDigits)

  const section = sanitizeSectionInput(general.section)

  const needsPortfolio = needsCreativesPortfolio(

    committee.firstCommittee,

    committee.secondCommittee

  )

  const needsGithub = needsDevelopmentGithub(

    committee.firstCommittee,

    committee.secondCommittee

  )



  return {

    firstName: general.firstName.trim(),

    lastName: general.lastName.trim(),

    email: `${general.emailLocal.trim()}${emailDomain}`,

    age: Number(general.age),

    birthday: general.birthday,

    gender: general.gender,

    section,

    studentNumber: general.studentNumber.trim(),

    contactNumber,

    facebookUrl: general.facebookUrl.trim(),

    dataPrivacyAgreed: privacy.dataPrivacyAgreed,

    motivation: committee.motivation.trim(),

    slotId: committee.slotId,

    ...(needsPortfolio

      ? { portfolioUrl: committee.portfolioUrl.trim() }

      : {}),

    ...(needsGithub && committee.githubUrl.trim()
      ? { githubUrl: committee.githubUrl.trim() }
      : {}),

    choices: [

      { positionId: committee.firstPositionId, preferenceRank: 1 },

      { positionId: committee.secondPositionId, preferenceRank: 2 },

    ],

    documents: [

      { documentType: "resume", fileName: upload.resume!.name },

      { documentType: "transcript", fileName: upload.transcript!.name },

      {

        documentType: "registration",

        fileName: upload.registration!.name,

      },

    ],

  }

}



export function submitBlockedMessage(

  privacy: PrivacyValues,

  general: GeneralInfoValues,

  committee: CommitteeValues,

  upload: UploadValues

): string | null {

  if (!privacy.dataPrivacyAgreed) {

    return privacyStepError()

  }

  if (!upload.resume || !upload.transcript || !upload.registration) {

    return uploadStepError

  }

  if (

    upload.resume.type !== "application/pdf" ||

    upload.transcript.type !== "application/pdf" ||

    upload.registration.type !== "application/pdf"

  ) {

    return uploadPdfStepError

  }

  if (

    !documentFileNameMatches("resume", upload.resume.name, general.lastName) ||

    !documentFileNameMatches(

      "transcript",

      upload.transcript.name,

      general.lastName

    ) ||

    !documentFileNameMatches(

      "registration",

      upload.registration.name,

      general.lastName

    )

  ) {

    return uploadFileNameError()

  }

  if (!generalValid(general)) {

    return "Your answers from Step 2 are missing or invalid. Go back and complete your profile."

  }

  if (!committee.motivation.trim()) {

    return "Your answer from Step 3 is missing. Go back and tell us why you want to join AWS Builders - UST."

  }

  if (

    committee.firstPositionId &&

    committee.secondPositionId &&

    committee.firstPositionId === committee.secondPositionId

  ) {

    return committeeStepError(committee)

  }

  if (!committee.slotId) {

    return "Go back to Step 3 and pick an interview time slot for your first-choice committee."

  }

  if (!committeeValid(committee)) {

    return committeeStepError(committee)

  }

  return null

}



export function mapApplyApiError(message: string): string {

  const lower = message.toLowerCase()

  if (

    message.includes("firstName, lastName, email") ||

    lower.includes("studentnumber") ||

    lower.includes("contactnumber") ||

    lower.includes("facebookurl")

  ) {

    return "Some required answers from Step 2 or Step 3 did not come through. Use Back to review those steps, then submit again."

  }

  if (lower.includes("data privacy") || lower.includes("dataprivacy")) {

    return privacyStepError()

  }

  if (lower.includes("document") || lower.includes("resume") || lower.includes("transcript") || lower.includes("registration") || lower.includes("s3key")) {

    return uploadStepError

  }

  if (lower.includes("portfolio") || lower.includes("github")) {

    return "Go back to Step 3 and check your portfolio or GitHub link for your committee choices."

  }

  if (lower.includes("choice") || lower.includes("position")) {

    return "Go back to Step 3 and choose two different open positions."

  }

  if (lower.includes("slot") || lower.includes("interview")) {

    return "Go back to Step 3 and pick an open interview slot for your first-choice committee."

  }

  if (lower.includes("age")) {

    return "Go back to Step 2 and enter a valid age."

  }

  if (lower.includes("birthday")) {

    return "Go back to Step 2 and pick a valid birthday."

  }

  if (lower.includes("gender")) {

    return "Go back to Step 2 and select your gender."

  }

  if (lower.includes("section")) {

    return "Go back to Step 2 and enter a valid year & section (e.g. 4CSC)."

  }

  if (lower.includes("email")) {

    return "Go back to Step 2 and check your UST email."

  }

  if (

    lower.includes("already submitted") ||

    lower.includes("one application per year") ||

    lower.includes("recruitment cycle")

  ) {

    return "You already applied for this recruitment cycle with this UST email. Only one application per year is allowed."

  }

  return message

}


