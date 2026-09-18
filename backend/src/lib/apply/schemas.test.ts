import assert from "node:assert/strict";
import test from "node:test";
import {
  createApplicationSchema,
  uploadPresignSchema,
} from "./schemas";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const checksum = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

function validApplication() {
  return {
    dataPrivacyAgreed: true,
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "JUAN@UST.EDU.PH",
    age: 21,
    birthday: "2005-04-12",
    gender: "male",
    section: "4csc",
    studentNumber: "2026123456",
    contactNumber: "+639171234567",
    facebookUrl: "https://facebook.com/juan.delacruz",
    motivation: "I want to join.",
    choices: [
      { positionId: uuid, preferenceRank: 1 },
      { positionId: "660e8400-e29b-41d4-a716-446655440000", preferenceRank: 2 },
    ],
    uploadSessionId: uuid,
    slotId: uuid,
  };
}

function documents(sizeBytes = 10_000_000) {
  return ["resume", "registration"].map((documentType) => ({
    documentType,
    fileName: `${documentType}.pdf`,
    sizeBytes,
    checksumSha256: checksum,
  }));
}

test("create schema preserves normalization and omits empty optional URLs", () => {
  const result = createApplicationSchema.safeParse({
    ...validApplication(),
    portfolioUrl: "",
    githubUrl: "",
  });
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.email, "juan@ust.edu.ph");
  assert.equal(result.data.section, "4CSC");
  assert.equal("portfolioUrl" in result.data, false);
  assert.equal("githubUrl" in result.data, false);
});

test("create schema keeps existing validation messages", () => {
  const cases = [
    [null, "Request body must be a JSON object."],
    [{ ...validApplication(), dataPrivacyAgreed: false }, "dataPrivacyAgreed must be true before submitting."],
    [{ ...validApplication(), firstName: "Juan123" }, "firstName and lastName must use letters only (max 100 characters)."],
    [{ ...validApplication(), lastName: "---" }, "lastName must include at least one letter for document file names."],
    [{ ...validApplication(), lastName: "'" }, "lastName must include at least one letter for document file names."],
    [{ ...validApplication(), email: "juan@example.com" }, "email must be a valid @ust.edu.ph address."],
    [{ ...validApplication(), motivation: "" }, "firstName, lastName, email, section, studentNumber, contactNumber, facebookUrl, and motivation are required."],
    [{ ...validApplication(), section: "BSCS" }, "section must be four characters: year digit plus three letters (e.g. 4CSC)."],
    [{ ...validApplication(), studentNumber: "123" }, "studentNumber must be exactly 10 digits."],
    [{ ...validApplication(), contactNumber: "9171234567" }, "contactNumber must be +63 followed by 10 digits."],
    [{ ...validApplication(), facebookUrl: "https://example.com" }, "facebookUrl must be a valid https Facebook profile link."],
    [{ ...validApplication(), age: 0 }, "age must be a positive integer."],
    [{ ...validApplication(), birthday: "2050-01-01" }, "birthday must be a valid date (YYYY-MM-DD) that is not in the future."],
    [{ ...validApplication(), gender: "other" }, "gender must be one of: male, female."],
    [{ ...validApplication(), choices: [] }, "choices must contain exactly two items."],
    [{ ...validApplication(), choices: [null, null] }, "Each choice must be an object."],
    [{ ...validApplication(), choices: [{ positionId: "bad", preferenceRank: 1 }, { positionId: uuid, preferenceRank: 2 }] }, "Each choice needs a valid positionId UUID."],
    [{ ...validApplication(), choices: [{ positionId: uuid, preferenceRank: 3 }, { positionId: "660e8400-e29b-41d4-a716-446655440000", preferenceRank: 2 }] }, "preferenceRank must be 1 or 2."],
    [{ ...validApplication(), choices: [{ positionId: uuid, preferenceRank: 1 }, { positionId: "660e8400-e29b-41d4-a716-446655440000", preferenceRank: 1 }] }, "choices must include ranks 1 and 2."],
    [{ ...validApplication(), choices: [{ positionId: uuid, preferenceRank: 1 }, { positionId: uuid, preferenceRank: 2 }] }, "choices must use two different positions."],
    [{ ...validApplication(), uploadSessionId: "nope" }, "uploadSessionId must be a valid UUID."],
    [{ ...validApplication(), slotId: "nope" }, "slotId must be a UUID."],
  ] as const;
  for (const [input, message] of cases) {
    const result = createApplicationSchema.safeParse(input);
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.issues[0].message, message);
  }
});

test("presign schema permits one or two documents and enforces the SI size limit", () => {
  assert.equal(uploadPresignSchema.safeParse({ documents: documents() }).success, true);
  assert.equal(uploadPresignSchema.safeParse({ documents: documents().slice(0, 1) }).success, true);
  const oversized = uploadPresignSchema.safeParse({ documents: documents(10_000_001) });
  assert.equal(oversized.success, false);
  if (!oversized.success) assert.equal(oversized.error.issues[0].message, "sizeBytes must be from 1 through 10000000.");
  const missing = uploadPresignSchema.safeParse({ documents: [] });
  assert.equal(missing.success, false);
  if (!missing.success) assert.equal(missing.error.issues[0].message, "documents must contain one or two items.");
});

test("presign schema keeps existing leaf-error messages", () => {
  const cases = [
    [null, "Request body must be a JSON object."],
    [{ documents: [{ ...documents()[0], documentType: "other" }, ...documents().slice(1)] }, "documentType must be resume or registration."],
    [{ documents: [{ ...documents()[0], documentType: "transcript" }, ...documents().slice(1)] }, "documentType must be resume or registration."],
    [{ documents: [{ ...documents()[0], fileName: "resume.txt" }, ...documents().slice(1)] }, "fileName must be a PDF name with 255 characters or fewer."],
    [{ documents: [{ ...documents()[0], checksumSha256: "bad" }, ...documents().slice(1)] }, "checksumSha256 must be a base64 SHA-256 checksum."],
    [{ documents: [{ ...documents()[0] }, { ...documents()[0] }] }, "Each document type may only appear once."],
  ] as const;
  for (const [input, message] of cases) {
    const result = uploadPresignSchema.safeParse(input);
    assert.equal(result.success, false);
    if (!result.success) assert.equal(result.error.issues[0].message, message);
  }
});

test("create schema accepts a Member-only application without positions or a slot", () => {
  const result = createApplicationSchema.safeParse({
    ...validApplication(),
    applicationType: "member",
    choices: [],
    slotId: undefined,
  });
  assert.equal(result.success, true);
  if (!result.success) return;
  assert.equal(result.data.applicationType, "member");
  assert.deepEqual(result.data.choices, []);
  assert.equal(result.data.slotId, undefined);
});

test("create schema rejects committee data on a Member-only application", () => {
  const result = createApplicationSchema.safeParse({
    ...validApplication(),
    applicationType: "member",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(
      result.error.issues[0]?.message,
      "Member-only applications cannot include committee choices or an interview slot.",
    );
  }
});