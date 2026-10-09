import assert from "node:assert/strict";
import test from "node:test";
import {
  documentFileNameMatches,
  formatLastName,
  formatPersonName,
  hasValidLastNameFileToken,
  isValidApplicantName,
  isValidGithubUrl,
  isValidGoogleDriveUrl,
  isValidMotivation,
  isValidSection,
  isValidUstApplicantEmail,
  validateChoiceUrls,
} from "./field-validation";

test("section format", () => {
  assert.equal(isValidSection("4CSC"), true);
  assert.equal(isValidSection("4csc"), true);
  assert.equal(isValidSection("BSCS"), false);
});

test("applicant text guards", () => {
  assert.equal(isValidApplicantName("Juan Dela Cruz"), true);
  assert.equal(isValidApplicantName("Juan123"), false);
  assert.equal(isValidUstApplicantEmail("juan@ust.edu.ph"), true);
  assert.equal(isValidUstApplicantEmail("juan@gmail.com"), false);
  assert.equal(isValidMotivation("I want to join."), true);
  assert.equal(hasValidLastNameFileToken("---"), false);
});

test("applicant names are capitalized word by word", () => {
  assert.equal(formatPersonName("juan dela cruz"), "Juan Dela Cruz");
  assert.equal(formatPersonName("  MARIA   SANTOS "), "Maria Santos");
  assert.equal(formatPersonName("ana-marie o'brien"), "Ana-Marie O'Brien");
  assert.equal(formatPersonName("antonio axellance iii"), "Antonio Axellance III");
  assert.equal(formatPersonName("nicole mcDonald"), "Nicole McDonald");
  assert.equal(formatPersonName("hannah muñoz"), "Hannah Muñoz");
  assert.equal(formatPersonName("ñico ÑUÑEZ"), "Ñico Ñuñez");
});

test("last names keep a lowercase particle as typed", () => {
  assert.equal(formatLastName("de leon"), "de Leon");
  assert.equal(formatLastName("de Mesa"), "de Mesa");
  assert.equal(formatLastName("De Leon"), "De Leon");
  assert.equal(formatLastName("DE LEON"), "De Leon");
  assert.equal(formatLastName("de la cruz"), "de la Cruz");
  assert.equal(formatLastName("dela cruz"), "dela Cruz");
  assert.equal(formatLastName("santos"), "Santos");
  assert.equal(formatLastName("de"), "De");
  assert.equal(formatLastName("o'brien-smith"), "O'Brien-Smith");
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
