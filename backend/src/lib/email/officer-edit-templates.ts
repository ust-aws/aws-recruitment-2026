import type { ChoiceRef } from "../apply/committee";
import { devExamParagraphs, officerFirstChoiceLinkExtras } from "./choice-email-extras";
import { isExecutiveOfficeCommittee } from "./officer-recipients";
import {
  applicantDevExamSubject,
  officerFirstChoiceJoinedSubject,
  officerFirstChoiceLeftSubject,
  officerInterviewRescheduledSubject,
} from "./subjects";
import type { RenderedEmail } from "./types";
import {
  APPLICATION_RECEIVED_HEADER_CID,
  brandedEmailHeaderInline,
  escapeHtmlForEmail,
  formatChoiceLabel,
  formatInterviewSlot,
  wrapBrandedHtml,
} from "./template-kit";

function officerApplicantDetailCard(input: {
  applicantName: string;
  studentNumber: string;
  email: string;
  applicationCode: string;
  firstChoice: string;
  secondChoice: string;
  interviewTime: string;
  linkExtras: { textLines: string; htmlRows: string };
}): { textBlock: string; htmlTable: string } {
  const textBlock = `Applicant: ${input.applicantName}
Student Number: ${input.studentNumber}
UST Email: ${input.email}
${input.linkExtras.textLines}First Choice: ${input.firstChoice}
Second Choice: ${input.secondChoice}
Interview: ${input.interviewTime}
Application ID: ${input.applicationCode}`;

  const htmlTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#170f33;">
      <p style="margin:0 0 12px;"><strong>Applicant</strong><br>${escapeHtmlForEmail(input.applicantName)}</p>
      <p style="margin:0 0 12px;"><strong>Student Number</strong><br>${escapeHtmlForEmail(input.studentNumber)}</p>
      <p style="margin:0 0 12px;"><strong>UST Email</strong><br>${escapeHtmlForEmail(input.email)}</p>
      ${input.linkExtras.htmlRows}
      <p style="margin:0 0 12px;"><strong>First Choice</strong><br>${escapeHtmlForEmail(input.firstChoice)}</p>
      <p style="margin:0 0 12px;"><strong>Second Choice</strong><br>${escapeHtmlForEmail(input.secondChoice)}</p>
      <p style="margin:0 0 12px;"><strong>Interview</strong><br>${escapeHtmlForEmail(input.interviewTime)}</p>
      <p style="margin:0;"><strong>Application ID</strong><br>${escapeHtmlForEmail(input.applicationCode)}</p>
    </td>
  </tr>
</table>`;

  return { textBlock, htmlTable };
}

export function officerFirstChoiceLeftTemplate(input: {
  officerLastName: string;
  applicantFirstName: string;
  applicantLastName: string;
  previousFirstChoice: ChoiceRef;
  newFirstChoice: ChoiceRef;
}): RenderedEmail {
  const subject = officerFirstChoiceLeftSubject({
    firstName: input.applicantFirstName,
    lastName: input.applicantLastName,
    firstChoiceCommittee: input.previousFirstChoice.committee,
  });
  const officerHonorific = `Mx. ${input.officerLastName}`;
  const applicantName = `${input.applicantFirstName} ${input.applicantLastName}`;
  const newChoice = formatChoiceLabel(input.newFirstChoice);
  const unitLabel = isExecutiveOfficeCommittee(input.previousFirstChoice.committee)
    ? "office"
    : "committee";

  const text = `Greetings from the Clouds!

Good day, ${officerHonorific},

${applicantName} has changed their first choice in R101. They are no longer listing your ${unitLabel} as first choice. Their new first choice is ${newChoice}.

You no longer need to hold an interview slot for this applicant.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "FIRST CHOICE UPDATE",
    bannerSub: "",
    heading: "Applicant Moved",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtmlForEmail(officerHonorific)},</p>
<p style="margin:0 0 16px;">${escapeHtmlForEmail(applicantName)} has changed their first choice in R101. They are no longer listing your ${escapeHtmlForEmail(unitLabel)} as first choice. Their new first choice is ${escapeHtmlForEmail(newChoice)}.</p>
<p style="margin:0 0 16px;">You no longer need to hold an interview slot for this applicant.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function officerFirstChoiceJoinedTemplate(input: {
  officerLastName: string;
  applicantFirstName: string;
  applicantLastName: string;
  studentNumber: string;
  email: string;
  applicationCode: string;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  firstChoice: ChoiceRef;
  secondChoice: ChoiceRef;
  interviewStartsAt: Date;
}): RenderedEmail {
  const subject = officerFirstChoiceJoinedSubject({
    firstName: input.applicantFirstName,
    lastName: input.applicantLastName,
    firstChoiceCommittee: input.firstChoice.committee,
  });
  const officerHonorific = `Mx. ${input.officerLastName}`;
  const applicantName = `${input.applicantFirstName} ${input.applicantLastName}`;
  const firstChoice = formatChoiceLabel(input.firstChoice);
  const secondChoice = formatChoiceLabel(input.secondChoice);
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);
  const unitLabel = isExecutiveOfficeCommittee(input.firstChoice.committee)
    ? "office"
    : "committee";
  const linkExtras = officerFirstChoiceLinkExtras({
    firstChoice: input.firstChoice,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
  });
  const detail = officerApplicantDetailCard({
    applicantName,
    studentNumber: input.studentNumber,
    email: input.email,
    applicationCode: input.applicationCode,
    firstChoice,
    secondChoice,
    interviewTime,
    linkExtras,
  });

  const text = `Greetings from the Clouds!

Good day, ${officerHonorific},

${applicantName} changed their first choice in R101 and now listed your ${unitLabel}.

${detail.textBlock}

You can review their file in the HR applications list when you are ready.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "FIRST CHOICE UPDATE",
    bannerSub: "",
    heading: "New First-Choice Applicant",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtmlForEmail(officerHonorific)},</p>
<p style="margin:0 0 16px;">${escapeHtmlForEmail(applicantName)} changed their first choice in R101 and now listed your ${escapeHtmlForEmail(unitLabel)}.</p>
${detail.htmlTable}
<p style="margin:0 0 16px;">You can review their file in the HR applications list when you are ready.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function officerInterviewRescheduledTemplate(input: {
  officerLastName: string;
  applicantFirstName: string;
  applicantLastName: string;
  interviewStartsAt: Date;
}): RenderedEmail {
  const subject = officerInterviewRescheduledSubject({
    firstName: input.applicantFirstName,
    lastName: input.applicantLastName,
  });
  const officerHonorific = `Mx. ${input.officerLastName}`;
  const applicantName = `${input.applicantFirstName} ${input.applicantLastName}`;
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);

  const text = `Greetings from the Clouds!

Good day, ${officerHonorific},

This applicant has changed their interview time slot.

Applicant: ${applicantName}
Interview: ${interviewTime}

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "INTERVIEW UPDATE",
    bannerSub: "",
    heading: "Interview Time Changed",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtmlForEmail(officerHonorific)},</p>
<p style="margin:0 0 16px;">This applicant has changed their interview time slot.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#170f33;">
      <p style="margin:0 0 12px;"><strong>Applicant</strong><br>${escapeHtmlForEmail(applicantName)}</p>
      <p style="margin:0;"><strong>Interview</strong><br>${escapeHtmlForEmail(interviewTime)}</p>
    </td>
  </tr>
</table>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function applicantDevExamTemplate(input: {
  lastName: string;
  applicationCode: string;
  choices: ChoiceRef[];
}): RenderedEmail {
  const subject = applicantDevExamSubject(input.applicationCode);
  const honorific = `Mx. ${input.lastName}`;
  const examCopy = devExamParagraphs(input.choices);

  const text = `Greetings from the Clouds!

Good day, ${honorific},

You updated your committee choices in R101.${examCopy.text}

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "R101 EXAM",
    bannerSub: input.applicationCode,
    heading: "Exam Specifications",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtmlForEmail(honorific)},</p>
<p style="margin:0 0 16px;">You updated your committee choices in R101.</p>
${examCopy.html}
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}
