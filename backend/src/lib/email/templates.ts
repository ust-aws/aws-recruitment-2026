import type { RenderedEmail } from "./types";
import { appBaseUrl, messengerGcLink, signatoryName } from "./config";
import {
  applicantOtpSubject,
  applicationSubmittedSubject,
  resultAcceptedSubject,
  resultRejectedSubject,
} from "./subjects";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#111">${body.replace(/\n/g, "<br>")}</body></html>`;
}

export function applicantOtpTemplate(input: {
  firstName: string;
  applicationCode: string;
  code: string;
  expiresInMinutes: number;
}): RenderedEmail {
  const signatory = signatoryName();
  const subject = applicantOtpSubject(input.applicationCode);
  const text = `Hi ${input.firstName},

Use this verification code to securely access your AWS Builders - UST application:

${input.code}

This code expires in ${input.expiresInMinutes} minutes and can only be used once. For your security, do not share it with anyone.

Application ID: ${input.applicationCode}

If you did not request this code, you can safely ignore this email.

Best regards,

${signatory}
AWS Builders - UST Recruitment Team`;

  const html = wrapHtml(
    `Hi ${escapeHtml(input.firstName)},<br><br>
Use this verification code to securely access your AWS Builders - UST application:<br><br>
<div style="display:inline-block;border:1px solid #d8d0ef;border-radius:12px;background:#f6f2ff;padding:18px 24px;text-align:center">
<strong style="font-size:30px;letter-spacing:6px;color:#201047">${escapeHtml(input.code)}</strong><br>
<span style="font-size:12px;color:#655c78">Expires in ${input.expiresInMinutes} minutes</span>
</div><br><br>
This code can only be used once. For your security, do not share it with anyone.<br><br>
<strong>Application ID:</strong> ${escapeHtml(input.applicationCode)}<br><br>
If you did not request this code, you can safely ignore this email.<br><br>
Best regards,<br><br>
${escapeHtml(signatory)}<br>
AWS Builders - UST Recruitment Team`,
  );

  return { subject, text, html };
}

export function applicationSubmittedTemplate(input: {
  firstName: string;
  applicationCode: string;
}): RenderedEmail {
  const applyUrl = `${appBaseUrl()}/apply`;
  const signatory = signatoryName();
  const subject = applicationSubmittedSubject(input.applicationCode);
  const text = `Greetings from the Clouds!

Hi ${input.firstName},

Thank you for applying to AWS Builders - UST. We received your application.

Please save your Application ID: ${input.applicationCode}

You can return to ${applyUrl} later to check your application status once that feature is available.

Best regards,

${signatory}`;

  const html = wrapHtml(
    `Greetings from the Clouds!<br><br>
Hi ${escapeHtml(input.firstName)},<br><br>
Thank you for applying to AWS Builders - UST. We received your application.<br><br>
<strong>Please save your Application ID:</strong> ${escapeHtml(input.applicationCode)}<br><br>
You can return to <a href="${escapeHtml(applyUrl)}">${escapeHtml(applyUrl)}</a> later to check your application status once that feature is available.<br><br>
Best regards,<br><br>
${escapeHtml(signatory)}`,
  );

  return { subject, text, html };
}

export function resultAcceptedTemplate(input: {
  lastName: string;
  position: string;
}): RenderedEmail {
  const gcLink = messengerGcLink();
  const signatory = signatoryName();
  const subject = resultAcceptedSubject;
  const text = `Greetings from the Clouds!

Good day, Mx. ${input.lastName},

Congratulations! We are pleased to inform you that you have been accepted into AWS Builders - UST as our newest ${input.position}. Your passion, skills, and enthusiasm truly stood out throughout the recruitment process, and your alignment with the values and vision of AWS Builders - UST did not go unnoticed.

We are confident that you will fulfill the responsibilities of this role with excellence and dedication. We look forward to building great things with you as we continue to grow our community of builders.

Please join our official GC (Messenger group chat) here: ${gcLink}

Welcome to the team, Mx. ${input.lastName}!

Best regards,

${signatory}`;

  const html = wrapHtml(
    `Greetings from the Clouds!<br><br>
Good day, Mx. ${escapeHtml(input.lastName)},<br><br>
Congratulations! We are pleased to inform you that you have been accepted into AWS Builders - UST as our newest ${escapeHtml(input.position)}. Your passion, skills, and enthusiasm truly stood out throughout the recruitment process, and your alignment with the values and vision of AWS Builders - UST did not go unnoticed.<br><br>
We are confident that you will fulfill the responsibilities of this role with excellence and dedication. We look forward to building great things with you as we continue to grow our community of builders.<br><br>
Please join our official GC (Messenger group chat) here: <a href="${escapeHtml(gcLink)}">${escapeHtml(gcLink)}</a><br><br>
Welcome to the team, Mx. ${escapeHtml(input.lastName)}!<br><br>
Best regards,<br><br>
${escapeHtml(signatory)}`,
  );

  return { subject, text, html };
}

export function resultRejectedTemplate(input: {
  lastName: string;
}): RenderedEmail {
  const signatory = signatoryName();
  const subject = resultRejectedSubject;
  const text = `Greetings from the Clouds!

Good day, Mx. ${input.lastName},

Thank you for taking the time to apply and for your interest in joining AWS Builders - UST. We truly appreciate the effort you put into the recruitment process.

After careful deliberation, we regret to inform you that you were not selected to join the organization this term. This was not an easy decision, as we had a highly competitive pool of applicants.

We encourage you to stay connected with us, as we regularly hold events, workshops, and future recruitment cycles that you're welcome to join. Your enthusiasm for cloud computing and technology is valued, and we hope to see you around!

Thank you again, and we wish you the best in your future endeavors.

Best regards,

${signatory}`;

  const html = wrapHtml(
    `Greetings from the Clouds!<br><br>
Good day, Mx. ${escapeHtml(input.lastName)},<br><br>
Thank you for taking the time to apply and for your interest in joining AWS Builders - UST. We truly appreciate the effort you put into the recruitment process.<br><br>
After careful deliberation, we regret to inform you that you were not selected to join the organization this term. This was not an easy decision, as we had a highly competitive pool of applicants.<br><br>
We encourage you to stay connected with us, as we regularly hold events, workshops, and future recruitment cycles that you're welcome to join. Your enthusiasm for cloud computing and technology is valued, and we hope to see you around!<br><br>
Thank you again, and we wish you the best in your future endeavors.<br><br>
Best regards,<br><br>
${escapeHtml(signatory)}`,
  );

  return { subject, text, html };
}
