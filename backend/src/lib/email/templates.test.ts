import assert from "node:assert/strict";
import test from "node:test";
import {
  applicantOtpTemplate,
  applicationSubmittedTemplate,
  resultAcceptedTemplate,
  resultRejectedTemplate,
} from "./templates";

test("applicant email templates use compact, plain formatting", async (t) => {
  await t.test("renders the OTP as bold text without a styled card", () => {
    const email = applicantOtpTemplate({
      firstName: "Marc",
      applicationCode: "AP-2026-288404",
      code: "076027",
      expiresInMinutes: 10,
    });

    assert.match(email.html, /application: <strong>076027<\/strong>/);
    assert.match(email.html, /Application ID: <strong>AP-2026-288404<\/strong>/);
    assert.doesNotMatch(email.html, /<div|background:|border-radius:/);
    assert.doesNotMatch(email.html, /<br><br><br>/);
  });

  await t.test("links the confirmation email to applicant status", () => {
    const email = applicationSubmittedTemplate({
      firstName: "Marc",
      applicationCode: "AP-2026-288404",
    });

    assert.match(
      email.html,
      /Application ID: <strong>AP-2026-288404<\/strong>/,
    );
    assert.match(email.html, /http:\/\/localhost:3000\/apply\/status/);
    assert.doesNotMatch(email.html, /once that feature is available/);
    assert.doesNotMatch(email.html, /<br><br><br>/);
  });

  await t.test("personalizes accepted and rejected result emails", () => {
    const accepted = resultAcceptedTemplate({
      lastName: "Dela Cruz",
      position: "Development Committee Staff",
    });
    const rejected = resultRejectedTemplate({ lastName: "Dela Cruz" });

    assert.match(accepted.text, /Mx\. Dela Cruz/);
    assert.match(accepted.subject, /R101/);
    assert.doesNotMatch(accepted.subject, /R1O1/);
    assert.match(accepted.text, /Development Committee Staff/);
    assert.match(accepted.html, /Development Committee Staff/);
    assert.match(rejected.text, /Mx\. Dela Cruz/);
    assert.match(rejected.subject, /R101/);
    assert.match(rejected.text, /were not selected/);
  });
});
