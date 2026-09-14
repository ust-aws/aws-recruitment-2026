import assert from "node:assert/strict";
import test from "node:test";
import { AWS_DEV_ASSESSMENT_FILENAME } from "./email-assets";
import {
  applicantDevExamTemplate,
  officerFirstChoiceJoinedTemplate,
  officerFirstChoiceLeftTemplate,
  officerInterviewRescheduledTemplate,
} from "./officer-edit-templates";
import {
  applicantOtpTemplate,
  applicationSubmittedTemplate,
  memberRegistrationTemplate,
  officerApplicationNoticeTemplate,
  resultAcceptedTemplate,
  resultRejectedTemplate,
} from "./templates";

test("applicant email templates use compact, plain formatting", async (t) => {
  await t.test("renders the OTP in the branded application email style", () => {
    const email = applicantOtpTemplate({
      lastName: "Olmedo",
      applicationCode: "AP-2026-288404",
      code: "076027",
      expiresInMinutes: 10,
    });

    assert.match(email.html, /Greetings from the Clouds!/);
    assert.match(email.html, /Good day, Mx\. Olmedo/);
    assert.match(email.html, /cid:application-received-header@aws-ust/);
    assert.equal(email.inline?.length, 1);
    assert.match(email.html, /076027/);
    assert.match(email.html, /Application ID: <strong>AP-2026-288404<\/strong>/);
    assert.match(email.html, />Open your application</);
    assert.match(email.html, /Yours in Thomasian Leadership,/);
    assert.doesNotMatch(email.html, /Hi /);
    assert.doesNotMatch(email.html, /Recruitment Team/);
  });

  await t.test("links the confirmation email to applicant status", () => {
    const email = applicationSubmittedTemplate({
      lastName: "Olmedo",
      applicationCode: "AP-2026-288404",
      firstChoice: {
        committee: "Development",
        title: "Development Committee Staff",
      },
      secondChoice: {
        committee: "Technical",
        title: "Technical Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });

    assert.match(email.html, /<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!<\/p>/);
    assert.match(email.html, /cid:application-received-header@aws-ust/);
    assert.equal(email.inline?.length, 1);
    assert.equal(email.inline?.[0]?.mimeType, "image/png");
    assert.match(email.html, /<strong>First Choice<\/strong>/);
    assert.match(email.html, /<strong>Interview<\/strong>/);
    assert.match(email.html, /Good day, Mx\. Olmedo/);
    assert.match(email.text, /Greetings from the Clouds!\n\n\nGood day/);
    assert.match(email.text, /Good day, Mx\. Olmedo/);
    assert.doesNotMatch(email.html, /Hi /);
    assert.doesNotMatch(email.text, /Hi /);
    assert.match(email.html, /<strong>AP-2026-288404<\/strong>/);
    assert.match(email.text, /Application ID: AP-2026-288404/);
    assert.match(email.html, /Development Committee Staff/);
    assert.match(email.html, /Technical Committee Staff/);
    assert.match(email.text, /change your interview slot/);
    assert.match(email.html, /Yours in Thomasian Leadership,/);
    assert.match(
      email.html,
      /<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board<\/p>/,
    );
    assert.match(email.html, /http:\/\/localhost:3000\/apply\/status/);
    assert.match(email.html, />View your application</);
    assert.doesNotMatch(email.html, /once that feature is available/);
    assert.doesNotMatch(email.html, /Recruitment Team/);
  });

  await t.test("notifies the first-choice officer with applicant details", () => {
    const email = officerApplicationNoticeTemplate({
      officerLastName: "Padua",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      studentNumber: "2023123456",
      email: "alden@ust.edu.ph",
      applicationCode: "AP-2026-288404",
      firstChoice: {
        committee: "Office of the Chief Executive Officer",
        title: "Chief Executive Officer",
      },
      secondChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });

    assert.match(email.subject, /New EA Applicant For Your Office — Alden Olmedo \| R101/);
    assert.match(email.text, /Good day, Mx\. Padua/);
    assert.match(email.text, /Student Number: 2023123456/);
    assert.match(email.text, /UST Email: alden@ust.edu.ph/);
    assert.match(email.text, /First Choice:/);
    assert.match(email.text, /Second Choice:/);
    assert.match(email.text, /Interview:/);
    assert.match(email.html, /cid:application-received-header@aws-ust/);
    assert.match(email.html, /<strong>Interview<\/strong>/);
    assert.equal(email.inline?.length, 1);
  });

  await t.test("personalizes accepted and rejected result emails", (t) => {
    const originalPaymentLink = process.env.MEMBERSHIP_PAYMENT_LINK;
    t.after(() => {
      if (originalPaymentLink === undefined) {
        delete process.env.MEMBERSHIP_PAYMENT_LINK;
      } else {
        process.env.MEMBERSHIP_PAYMENT_LINK = originalPaymentLink;
      }
    });
    process.env.MEMBERSHIP_PAYMENT_LINK = "https://payments.example/membership";
    const accepted = resultAcceptedTemplate({
      lastName: "Dela Cruz",
      position: "Development Committee Staff",
      memberId: "AWS-2026-0001",
    });
    const rejected = resultRejectedTemplate({ lastName: "Dela Cruz" });

    assert.match(accepted.text, /Mx\. Dela Cruz/);
    assert.match(accepted.subject, /R101/);
    assert.doesNotMatch(accepted.subject, /R1O1/);
    assert.match(accepted.text, /Development Committee Staff/);
    assert.match(accepted.html, /Development Committee Staff/);
    assert.match(accepted.text, /Membership ID: AWS-2026-0001/);
    assert.match(accepted.html, /AWS-2026-0001/);
    assert.match(accepted.html, /cid:application-received-header@aws-ust/);
    assert.match(accepted.text, /₱250 membership fee/);
    assert.match(accepted.html, /https:\/\/payments\.example\/membership/);
    assert.match(accepted.html, />Proceed to payment</);
    assert.match(accepted.html, />Join the Messenger group chat</);
    assert.doesNotMatch(accepted.html, /Best regards/);
    assert.match(rejected.text, /Mx\. Dela Cruz/);
    assert.match(rejected.subject, /R101/);
    assert.match(rejected.text, /not selected for a committee position/);
    assert.match(rejected.text, /still join AWS Builders - UST as a member/);
    assert.match(rejected.text, /₱250 membership fee/);
    assert.match(rejected.html, /https:\/\/payments\.example\/membership/);
    assert.match(rejected.html, />Proceed to payment</);
    assert.doesNotMatch(rejected.text, /Membership ID/);
    assert.match(rejected.html, /Yours in Thomasian Leadership,/);
  });

  await t.test("sends a Member-only registration email without payment details", () => {
    const registration = memberRegistrationTemplate({
      lastName: "Olmedo",
      applicationCode: "AP-2026-288404",
    });

    assert.match(registration.subject, /Membership Registration/);
    assert.match(registration.text, /has been accepted/);
    assert.match(registration.text, /does not require an interview/);
    assert.match(registration.text, /after R101/);
    assert.match(registration.text, /do not send a payment yet/);
    assert.doesNotMatch(registration.text, /₱250/);
  });  await t.test("application received includes dev exam copy when Development is a choice", () => {
    const email = applicationSubmittedTemplate({
      lastName: "Olmedo",
      applicationCode: "AP-2026-288404",
      firstChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
      secondChoice: {
        committee: "Technical Committee",
        title: "Technical Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });

    assert.match(email.text, /special exam/);
    assert.match(email.text, /Development Committee/);
    assert.match(email.html, /exam specifications are attached below/);
    assert.doesNotMatch(
      applicationSubmittedTemplate({
        lastName: "Olmedo",
        applicationCode: "AP-2026-288404",
        firstChoice: {
          committee: "Logistics Committee",
          title: "Logistics Committee Staff",
        },
        secondChoice: {
          committee: "Technical Committee",
          title: "Technical Committee Staff",
        },
        interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
      }).text,
      /special exam/,
    );
  });

  await t.test("officer notice includes portfolio and GitHub for qualifying first choices", () => {
    const creatives = officerApplicationNoticeTemplate({
      officerLastName: "Padua",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      studentNumber: "2023123456",
      email: "alden@ust.edu.ph",
      applicationCode: "AP-2026-288404",
      portfolioUrl: "https://drive.google.com/file/d/abc/view",
      githubUrl: "https://github.com/alden",
      firstChoice: {
        committee: "Media Committee",
        title: "Media Committee Staff",
      },
      secondChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });
    assert.match(creatives.text, /Portfolio: https:\/\/drive\.google\.com/);
    assert.doesNotMatch(creatives.text, /GitHub:/);

    const dev = officerApplicationNoticeTemplate({
      officerLastName: "Casas",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      studentNumber: "2023123456",
      email: "alden@ust.edu.ph",
      applicationCode: "AP-2026-288404",
      githubUrl: "https://github.com/alden",
      firstChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
      secondChoice: {
        committee: "Logistics Committee",
        title: "Logistics Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });
    assert.match(dev.text, /GitHub: https:\/\/github\.com\/alden/);

    const ctoEa = officerApplicationNoticeTemplate({
      officerLastName: "Casas",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      studentNumber: "2023123456",
      email: "alden@ust.edu.ph",
      applicationCode: "AP-2026-288404",
      githubUrl: "https://github.com/alden",
      firstChoice: {
        committee: "Office of the Chief Technology Officer",
        title: "Executive Assistant to the CTO",
      },
      secondChoice: {
        committee: "Logistics Committee",
        title: "Logistics Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });
    assert.match(ctoEa.text, /GitHub: https:\/\/github\.com\/alden/);
  });

  await t.test("officer edit templates omit PII where specified", () => {
    const left = officerFirstChoiceLeftTemplate({
      officerLastName: "Padua",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      previousFirstChoice: {
        committee: "Office of the Chief Executive Officer",
        title: "Chief Executive Officer",
      },
      newFirstChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
    });
    assert.doesNotMatch(left.text, /Student number/);
    assert.doesNotMatch(left.text, /Application ID/);
    assert.doesNotMatch(left.html, /#f8f5ff/);

    const reschedule = officerInterviewRescheduledTemplate({
      officerLastName: "Padua",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
    });
    assert.doesNotMatch(reschedule.text, /Student number/);
    assert.match(reschedule.html, /Interview Time Changed/);
    assert.match(reschedule.text, /This applicant has changed their interview time slot/);
    assert.match(reschedule.text, /Applicant: Alden Olmedo/);
    assert.doesNotMatch(reschedule.text, /Alden Olmedo has changed/);

    const joined = officerFirstChoiceJoinedTemplate({
      officerLastName: "Casas",
      applicantFirstName: "Alden",
      applicantLastName: "Olmedo",
      studentNumber: "2023123456",
      email: "alden@ust.edu.ph",
      applicationCode: "AP-2026-288404",
      firstChoice: {
        committee: "Development Committee",
        title: "Development Committee Staff",
      },
      secondChoice: {
        committee: "Logistics Committee",
        title: "Logistics Committee Staff",
      },
      interviewStartsAt: new Date("2026-09-12T06:00:00.000Z"),
      githubUrl: "https://github.com/alden",
    });
    assert.match(joined.text, /Student Number: 2023123456/);
    assert.match(joined.text, /GitHub: https:\/\/github\.com\/alden/);
  });

  await t.test("applicant dev exam edit email references assessment attachment name", () => {
    const email = applicantDevExamTemplate({
      lastName: "Olmedo",
      applicationCode: "AP-2026-288404",
      choices: [
        {
          committee: "Office of the Chief Technology Officer",
          title: "Executive Assistant to the CTO",
        },
        {
          committee: "Logistics Committee",
          title: "Logistics Committee Staff",
        },
      ],
    });
    assert.match(email.text, /Executive Assistant to the CTO/);
    assert.match(email.text, /exam specifications are attached below/);
    assert.equal(AWS_DEV_ASSESSMENT_FILENAME, "AWS Dev Assessment.pdf");
  });
});
