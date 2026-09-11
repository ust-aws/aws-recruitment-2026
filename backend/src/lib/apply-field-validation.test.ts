import assert from "node:assert/strict";
import test from "node:test";
import {
  documentFileNameMatches,
  hasValidLastNameFileToken,
  isValidApplicantName,
  isValidDevUploadS3Key,
  isValidGithubUrl,
  isValidGoogleDriveUrl,
  isValidMotivation,
  isValidSection,
  isValidUstApplicantEmail,
  validateChoiceUrls,
} from "./apply-field-validation";

test("section format", () => {
  assert.equal(isValidSection("4CSC"), true);
  assert.equal(isValidSection("4csc"), true);
  assert.equal(isValidSection("BSCS"), false);
});

test("applicant text and upload guards", () => {
  assert.equal(isValidApplicantName("Juan Dela Cruz"), true);
  assert.equal(isValidApplicantName("Juan123"), false);
  assert.equal(isValidUstApplicantEmail("juan@ust.edu.ph"), true);
  assert.equal(isValidUstApplicantEmail("juan@gmail.com"), false);
  assert.equal(isValidMotivation("I want to join."), true);
  assert.equal(hasValidLastNameFileToken("---"), false);
  assert.equal(
    isValidDevUploadS3Key(
      "dev/uploads/550e8400-e29b-41d4-a716-446655440000/CV_olmedo.pdf",
      "resume",
      "Olmedo",
    ),
    true,
  );
  assert.equal(
    isValidDevUploadS3Key("dev/uploads/evil/CV_olmedo.pdf", "resume", "Olmedo"),
    false,
  );
});

test("document file names", () => {
  assert.equal(
    documentFileNameMatches("resume", "CV_Olmedo.pdf", "Olmedo"),
    true,
  );
  assert.equal(
    documentFileNameMatches("transcript", "tor_olmedo.pdf", "Olmedo"),
    true,
  );
  assert.equal(
    documentFileNameMatches("registration", "RegForm_Olmedo.pdf", "Olmedo"),
    true,
  );
});

test("choice url rules", () => {
  assert.equal(
    validateChoiceUrls(
      ["Media Committee"],
      "https://drive.google.com/file/d/abc123/view?usp=sharing",
      "",
    ),
    null,
  );
  assert.equal(
    validateChoiceUrls(
      ["Development Committee"],
      "",
      "https://github.com/octocat",
    ),
    null,
  );
  assert.equal(
    isValidGoogleDriveUrl("https://www.google.com/search?q=drive"),
    false,
  );
  assert.equal(
    isValidGithubUrl("https://github.com/octocat/my-repo"),
    false,
  );
  assert.match(
    validateChoiceUrls(["Media Committee"], "", "") ?? "",
    /portfolioUrl/,
  );
});
