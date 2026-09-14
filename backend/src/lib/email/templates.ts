import type { RenderedEmail } from "./types";
import {
  appBaseUrl,
  membershipPaymentLink,
  messengerGcLink,
} from "./config";
import { devExamParagraphs, officerFirstChoiceLinkExtras } from "./choice-email-extras";
import { isExecutiveOfficeCommittee } from "./officer-recipients";
import {
  applicantOtpSubject,
  applicantInterviewBookingSubject,
  applicantInterviewReminderSubject,
  applicationSubmittedSubject,
  officerApplicationNoticeSubject,
  memberRegistrationSubject,
  resultAcceptedSubject,
  resultRejectedSubject,
} from "./subjects";
import {
  academicYearLabel,
  APPLICATION_RECEIVED_HEADER_CID,
  brandedEmailHeaderInline,
  ctaButton,
  escapeHtmlForEmail,
  formatChoiceLabel,
  formatInterviewSlot,
  wrapBrandedHtml,
} from "./template-kit";

const escapeHtml = escapeHtmlForEmail;

export { APPLICATION_RECEIVED_HEADER_CID };

export function applicantOtpTemplate(input: {
  lastName: string;
  applicationCode: string;
  code: string;
  expiresInMinutes: number;
}): RenderedEmail {
  const statusUrl = `${appBaseUrl()}/apply/status`;
  const subject = applicantOtpSubject(input.applicationCode);
  const honorific = `Mx. ${input.lastName}`;
  const yearLabel = academicYearLabel(input.applicationCode);

  const text = `Greetings from the Clouds!


Good day, ${honorific},

You asked to sign in to your AWS Builders - UST application. Use the verification code below on your application status page.

Verification Code: ${input.code}

This code expires in ${input.expiresInMinutes} minutes and can only be used once. For your security, do not share it with anyone.

Application ID: ${input.applicationCode}

Open your application: ${statusUrl}

If you did not request this code, you can safely ignore this email.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "WELCOME, BUILDER!",
    bannerSub: yearLabel,
    heading: "Verification Code",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">You asked to sign in to your AWS Builders - UST application. Enter the verification code below on your application status page.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:20px 18px;text-align:center;font-family:Arial,Helvetica,sans-serif;color:#170f33;">
      <p style="margin:0 0 10px;font-size:14px;"><strong>Verification Code</strong></p>
      <p style="margin:0;font-size:28px;letter-spacing:0.18em;color:#46258a;font-weight:bold;">${escapeHtml(input.code)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;">This code expires in ${input.expiresInMinutes} minutes and can only be used once. For your security, do not share it with anyone.</p>
<p style="margin:0 0 16px;">Application ID: <strong>${escapeHtml(input.applicationCode)}</strong></p>
${ctaButton(statusUrl, "Open your application")}
<p style="margin:0 0 16px;">If you did not request this code, you can safely ignore this email.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function applicationSubmittedTemplate(input: {
  lastName: string;
  applicationCode: string;
  firstChoice: { committee: string; title: string };
  secondChoice: { committee: string; title: string };
  interviewStartsAt: Date;
}): RenderedEmail {
  const statusUrl = `${appBaseUrl()}/apply/status`;
  const subject = applicationSubmittedSubject(input.applicationCode);
  const honorific = `Mx. ${input.lastName}`;
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);
  const firstChoice = formatChoiceLabel(input.firstChoice);
  const secondChoice = formatChoiceLabel(input.secondChoice);
  const yearLabel = academicYearLabel(input.applicationCode);
  const examCopy = devExamParagraphs([input.firstChoice, input.secondChoice]);

  const text = `Greetings from the Clouds!


Good day, ${honorific},

Thank you for applying to AWS Builders - UST. We received your application, and we are excited to meet you.

Please save your Application ID: ${input.applicationCode}

First Choice: ${firstChoice}
Second Choice: ${secondChoice}
Interview: ${interviewTime}
${examCopy.text}
While the application season is open, you can still change your interview slot from your application page. Keep this Application ID so you can return whenever you need to.

We cannot wait to see you and to build with you.

Check your application: ${statusUrl}

Once again, thank you for taking this first step with us. We look forward to meeting you.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const headerImageUrl = `cid:${APPLICATION_RECEIVED_HEADER_CID}`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "WELCOME, BUILDER!",
    bannerSub: yearLabel,
    heading: "Application Received",
    headerImageUrl,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">Thank you for applying to AWS Builders - UST. We received your application, and we are excited to meet you.</p>
<p style="margin:0 0 16px;">Please save your Application ID: <strong>${escapeHtml(input.applicationCode)}</strong></p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#170f33;">
      <p style="margin:0 0 12px;"><strong>First Choice</strong><br>${escapeHtml(firstChoice)}</p>
      <p style="margin:0 0 12px;"><strong>Second Choice</strong><br>${escapeHtml(secondChoice)}</p>
      <p style="margin:0;"><strong>Interview</strong><br>${escapeHtml(interviewTime)}</p>
    </td>
  </tr>
</table>
${examCopy.html}
<p style="margin:0 0 16px;">While the application season is open, you can still change your interview slot from your application page. Keep this Application ID so you can return whenever you need to.</p>
<p style="margin:0 0 16px;">We cannot wait to see you and to build with you.</p>
${ctaButton(statusUrl, "View your application")}
<p style="margin:0 0 16px;">Once again, thank you for taking this first step with us. We look forward to meeting you.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return {
    subject,
    text,
    html,
    inline: [brandedEmailHeaderInline()],
  };
}

export function applicantInterviewBookingTemplate(input: {
  lastName: string;
  applicationCode: string;
  committeeName: string;
  interviewStartsAt: Date;
  rescheduled: boolean;
}): RenderedEmail {
  const statusUrl = `${appBaseUrl()}/apply/status`;
  const subject = applicantInterviewBookingSubject(input.applicationCode);
  const honorific = `Mx. ${input.lastName}`;
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);
  const action = input.rescheduled ? "rescheduled" : "confirmed";

  const text = `Greetings from the Clouds!

Good day, ${honorific},

Your interview schedule has been ${action}.

Committee: ${input.committeeName}
Interview: ${interviewTime}
Application ID: ${input.applicationCode}

An updated calendar file is attached. Open it to add the interview to your calendar.

View your application: ${statusUrl}

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "INTERVIEW UPDATE",
    bannerSub: input.applicationCode,
    heading: "Interview Schedule Updated",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">Your interview schedule has been ${action}.</p>
<p style="margin:0 0 12px;"><strong>Committee</strong><br>${escapeHtml(input.committeeName)}</p>
<p style="margin:0 0 12px;"><strong>Interview</strong><br>${escapeHtml(interviewTime)}</p>
<p style="margin:0 0 16px;"><strong>Application ID</strong><br>${escapeHtml(input.applicationCode)}</p>
<p style="margin:0 0 16px;">An updated calendar file is attached. Open it to add the interview to your calendar.</p>
${ctaButton(statusUrl, "View your application")}
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function interviewReminderTemplate(input: {
  lastName: string;
  applicationCode: string;
  committeeName: string;
  interviewStartsAt: Date;
  reminder: "24h" | "1h";
}): RenderedEmail {
  const statusUrl = `${appBaseUrl()}/apply/status`;
  const subject = applicantInterviewReminderSubject(input.applicationCode);
  const honorific = `Mx. ${input.lastName}`;
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);
  const timing =
    input.reminder === "24h"
      ? "Your interview is coming up within 24 hours."
      : "Your interview starts within an hour.";

  const text = `Greetings from the Clouds!

Good day, ${honorific},

${timing}

Committee: ${input.committeeName}
Interview: ${interviewTime}
Application ID: ${input.applicationCode}

The calendar file is attached again for convenience.

View your application: ${statusUrl}

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "INTERVIEW REMINDER",
    bannerSub: input.applicationCode,
    heading: "Your Interview Is Coming Up",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">${timing}</p>
<p style="margin:0 0 12px;"><strong>Committee</strong><br>${escapeHtml(input.committeeName)}</p>
<p style="margin:0 0 12px;"><strong>Interview</strong><br>${escapeHtml(interviewTime)}</p>
<p style="margin:0 0 16px;"><strong>Application ID</strong><br>${escapeHtml(input.applicationCode)}</p>
<p style="margin:0 0 16px;">The calendar file is attached again for convenience.</p>
${ctaButton(statusUrl, "View your application")}
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return { subject, text, html, inline: [brandedEmailHeaderInline()] };
}

export function officerApplicationNoticeTemplate(input: {
  officerLastName: string;
  applicantFirstName: string;
  applicantLastName: string;
  studentNumber: string;
  email: string;
  applicationCode: string;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  firstChoice: { committee: string; title: string };
  secondChoice: { committee: string; title: string };
  interviewStartsAt: Date;
}): RenderedEmail {
  const subject = officerApplicationNoticeSubject({
    firstName: input.applicantFirstName,
    lastName: input.applicantLastName,
    firstChoiceCommittee: input.firstChoice.committee,
  });
  const officerHonorific = `Mx. ${input.officerLastName}`;
  const applicantName = `${input.applicantFirstName} ${input.applicantLastName}`;
  const firstChoice = formatChoiceLabel(input.firstChoice);
  const secondChoice = formatChoiceLabel(input.secondChoice);
  const interviewTime = formatInterviewSlot(input.interviewStartsAt);
  const yearLabel = academicYearLabel(input.applicationCode);
  const unitLabel = isExecutiveOfficeCommittee(input.firstChoice.committee)
    ? "office"
    : "committee";
  const linkExtras = officerFirstChoiceLinkExtras({
    firstChoice: input.firstChoice,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
  });

  const text = `Greetings from the Clouds!

Good day, ${officerHonorific},

A new applicant listed your ${unitLabel} as their first choice in R101.

Applicant: ${applicantName}
Student Number: ${input.studentNumber}
UST Email: ${input.email}
${linkExtras.textLines}First Choice: ${firstChoice}
Second Choice: ${secondChoice}
Interview: ${interviewTime}
Application ID: ${input.applicationCode}

You can review their file in the HR applications list when you are ready.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "NEW APPLICANT",
    bannerSub: yearLabel,
    heading: "First-Choice Notice",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(officerHonorific)},</p>
<p style="margin:0 0 16px;">A new applicant listed your ${escapeHtml(unitLabel)} as their first choice in R101.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#170f33;">
      <p style="margin:0 0 12px;"><strong>Applicant</strong><br>${escapeHtml(applicantName)}</p>
      <p style="margin:0 0 12px;"><strong>Student Number</strong><br>${escapeHtml(input.studentNumber)}</p>
      <p style="margin:0 0 12px;"><strong>UST Email</strong><br>${escapeHtml(input.email)}</p>
      ${linkExtras.htmlRows}
      <p style="margin:0 0 12px;"><strong>First Choice</strong><br>${escapeHtml(firstChoice)}</p>
      <p style="margin:0 0 12px;"><strong>Second Choice</strong><br>${escapeHtml(secondChoice)}</p>
      <p style="margin:0 0 12px;"><strong>Interview</strong><br>${escapeHtml(interviewTime)}</p>
      <p style="margin:0;"><strong>Application ID</strong><br>${escapeHtml(input.applicationCode)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;">You can review their file in the HR applications list when you are ready.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return {
    subject,
    text,
    html,
    inline: [brandedEmailHeaderInline()],
  };
}

export function memberRegistrationTemplate(input: {
  lastName: string;
  applicationCode: string;
}): RenderedEmail {
  const statusUrl = `${appBaseUrl()}/apply/status`;
  const honorific = `Mx. ${input.lastName}`;
  const text = `Greetings from the Clouds!\n\nGood day, ${honorific},\n\nThank you for registering to join AWS Builders - UST as a member. Your membership registration has been accepted and does not require an interview.\n\nApplication ID: ${input.applicationCode}\n\nMembership payment will open after R101. Please wait for the official payment instructions and do not send a payment yet.\n\nView your application: ${statusUrl}\n\nYours in Thomasian Leadership,\nThe AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "MEMBERSHIP REGISTRATION",
    bannerSub: input.applicationCode,
    heading: "Registration Accepted",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">Thank you for registering to join AWS Builders - UST as a member. Your membership registration has been accepted and does not require an interview.</p>
<p style="margin:0 0 16px;"><strong>Application ID:</strong> ${escapeHtml(input.applicationCode)}</p>
<p style="margin:0 0 16px;">Membership payment will open after <strong>R101</strong>. Please wait for the official payment instructions and <strong>do not send a payment yet</strong>.</p>
${ctaButton(statusUrl, "View your application")}
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return {
    subject: memberRegistrationSubject(input.applicationCode),
    text,
    html,
    inline: [brandedEmailHeaderInline()],
  };
}
export function resultAcceptedTemplate(input: {
  lastName: string;
  position: string;
  memberId: string;
}): RenderedEmail {
  const gcLink = messengerGcLink();
  const paymentLink = membershipPaymentLink();
  const subject = resultAcceptedSubject;
  const honorific = `Mx. ${input.lastName}`;
  const paymentText = paymentLink
    ? `Proceed to payment: ${paymentLink}`
    : "Payment instructions will be shared separately.";
  const paymentHtml = paymentLink
    ? ctaButton(paymentLink, "Proceed to payment")
    : '<p style="margin:0 0 16px;">Payment instructions will be shared separately.</p>';

  const text = `Greetings from the Clouds!


Good day, ${honorific},

Congratulations! We are thrilled to welcome you to AWS Builders - UST as our newest ${input.position}. Your passion, skills, and enthusiasm stood out throughout R101, and we cannot wait to build with you.

Please save these details for your records:

Membership ID: ${input.memberId}
Position: ${input.position}

Your Membership ID is how we will recognize you in the org. Keep it somewhere you can find it.

To complete your membership, please pay the ₱250 membership fee.

${paymentText}

Please join our official Messenger group chat here: ${gcLink}

Welcome to the team, ${honorific}. It is always Day One — and yours starts now.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "WELCOME, BUILDER!",
    bannerSub: "R101 Results",
    heading: "You Are Accepted",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">Congratulations! We are thrilled to welcome you to AWS Builders - UST as our newest ${escapeHtml(input.position)}. Your passion, skills, and enthusiasm stood out throughout R101, and we cannot wait to build with you.</p>
<p style="margin:0 0 16px;">Please save these details for your records:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8f5ff;border-radius:8px;">
  <tr>
    <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#170f33;">
      <p style="margin:0 0 12px;"><strong>Membership ID</strong><br>${escapeHtml(input.memberId)}</p>
      <p style="margin:0;"><strong>Position</strong><br>${escapeHtml(input.position)}</p>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;">Your Membership ID is how we will recognize you in the org. Keep it somewhere you can find it.</p>
<p style="margin:0 0 16px;">To complete your membership, please pay the <strong>₱250 membership fee</strong>.</p>
${paymentHtml}
${ctaButton(gcLink, "Join the Messenger group chat")}
<p style="margin:0 0 16px;">Welcome to the team, ${escapeHtml(honorific)}. It is always Day One — and yours starts now.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return {
    subject,
    text,
    html,
    inline: [brandedEmailHeaderInline()],
  };
}

export function resultRejectedTemplate(input: {
  lastName: string;
}): RenderedEmail {
  const paymentLink = membershipPaymentLink();
  const subject = resultRejectedSubject;
  const honorific = `Mx. ${input.lastName}`;
  const paymentText = paymentLink
    ? `Proceed to payment: ${paymentLink}`
    : "Payment instructions will be shared separately.";
  const paymentHtml = paymentLink
    ? ctaButton(paymentLink, "Proceed to payment")
    : '<p style="margin:0 0 16px;">Payment instructions will be shared separately.</p>';

  const text = `Greetings from the Clouds!


Good day, ${honorific},

Thank you for applying to AWS Builders - UST and for the time and care you put into R101. We saw the effort you brought to this process, and it meant a lot to us.

After careful deliberation, we regret to inform you that you were not selected for a committee position this term. This was not an easy decision. We had a highly competitive pool of applicants, and choosing among so many strong builders was genuinely difficult.

You can still join AWS Builders - UST as a member by paying the ₱250 membership fee.

${paymentText}

Please know that this outcome does not take away from what you showed us. We would be glad to see you at our events and workshops, and we hope you will consider applying again in a future cycle.

Thank you again, ${honorific}. We wish you the very best, and we hope our paths still cross in the cloud.

Yours in Thomasian Leadership,
The AWS Builders - UST Executive Board`;

  const html = wrapBrandedHtml({
    eyebrow: "AWS BUILDERS – UST",
    bannerTitle: "R101 RESULTS",
    bannerSub: "Thank you for applying",
    heading: "Recruitment Update",
    headerImageUrl: `cid:${APPLICATION_RECEIVED_HEADER_CID}`,
    headerImageAlt: "AWS Builders - UST — It's Always Day One",
    inner: `<p style="margin:0 0 8px;font-weight:bold;">Greetings from the Clouds!</p>
<p style="margin:0 0 0;line-height:8px;font-size:8px;">&nbsp;</p>
<p style="margin:0 0 20px;font-weight:bold;">Good day, ${escapeHtml(honorific)},</p>
<p style="margin:0 0 16px;">Thank you for applying to AWS Builders - UST and for the time and care you put into R101. We saw the effort you brought to this process, and it meant a lot to us.</p>
<p style="margin:0 0 16px;">After careful deliberation, we regret to inform you that you were not selected for a committee position this term. This was not an easy decision. We had a highly competitive pool of applicants, and choosing among so many strong builders was genuinely difficult.</p>
<p style="margin:0 0 16px;">You can still join AWS Builders - UST as a member by paying the <strong>₱250 membership fee</strong>.</p>
${paymentHtml}
<p style="margin:0 0 16px;">Please know that this outcome does not take away from what you showed us. We would be glad to see you at our events and workshops, and we hope you will consider applying again in a future cycle.</p>
<p style="margin:0 0 16px;">Thank you again, ${escapeHtml(honorific)}. We wish you the very best, and we hope our paths still cross in the cloud.</p>
<p style="margin:24px 0 0;">Yours in Thomasian Leadership,</p>
<p style="margin:4px 0 28px;font-weight:bold;">The AWS Builders - UST Executive Board</p>`,
  });

  return {
    subject,
    text,
    html,
    inline: [brandedEmailHeaderInline()],
  };
}
