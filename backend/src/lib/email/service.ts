import type { ApplicationJson } from "../applications";
import { emailEnabled, hasGmailCredentials } from "./config";
import { sendViaGmail } from "./gmail-client";
import * as notifications from "./notifications";
import { withRetry } from "./retry";
import {
  applicantOtpTemplate,
  applicationSubmittedTemplate,
  resultAcceptedTemplate,
  resultRejectedTemplate,
} from "./templates";
import type { EmailMessageType, RenderedEmail } from "./types";

async function deliverEmail(input: {
  applicationId?: string | null;
  messageType: EmailMessageType;
  recipient: string;
  rendered: RenderedEmail;
}): Promise<void> {
  const pending = await notifications.createPending({
    applicationId: input.applicationId,
    messageType: input.messageType,
    recipient: input.recipient,
  });

  const enabled = emailEnabled();
  const configured = hasGmailCredentials();
  const canSend = enabled && configured;
  if (!canSend) {
    const reason = !enabled ? "EMAIL_ENABLED=false" : "missing Gmail credentials";
    console.info(
      `[email] skipped ${input.messageType} to ${input.recipient} (${reason})`,
      input.rendered.subject,
    );
    await notifications.markFailed(pending.id, reason);
    return;
  }

  try {
    const result = await withRetry(async () => {
      await notifications.incrementAttempts(pending.id);
      return sendViaGmail({
        to: input.recipient,
        subject: input.rendered.subject,
        text: input.rendered.text,
        html: input.rendered.html,
      });
    });
    await notifications.markSent(pending.id, result.providerMessageId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await notifications.markFailed(pending.id, message);
    throw err;
  }
}

export async function sendApplicantOtp(input: {
  applicationId: string;
  applicationCode: string;
  firstName: string;
  email: string;
  code: string;
  expiresInMinutes: number;
}): Promise<void> {
  const rendered = applicantOtpTemplate({
    firstName: input.firstName,
    applicationCode: input.applicationCode,
    code: input.code,
    expiresInMinutes: input.expiresInMinutes,
  });
  await deliverEmail({
    applicationId: input.applicationId,
    messageType: "applicant_otp",
    recipient: input.email,
    rendered,
  });
}

export async function sendApplicationSubmitted(
  application: ApplicationJson,
): Promise<void> {
  const rendered = applicationSubmittedTemplate({
    firstName: application.firstName,
    applicationCode: application.applicationCode,
  });
  await deliverEmail({
    applicationId: application.id,
    messageType: "application_submitted",
    recipient: application.email,
    rendered,
  });
}

export async function sendResultAccepted(input: {
  applicationId: string;
  lastName: string;
  email: string;
  position: string;
}): Promise<void> {
  const rendered = resultAcceptedTemplate({
    lastName: input.lastName,
    position: input.position,
  });
  await deliverEmail({
    applicationId: input.applicationId,
    messageType: "result_accepted",
    recipient: input.email,
    rendered,
  });
}

export async function sendResultRejected(input: {
  applicationId: string;
  lastName: string;
  email: string;
}): Promise<void> {
  const rendered = resultRejectedTemplate({ lastName: input.lastName });
  await deliverEmail({
    applicationId: input.applicationId,
    messageType: "result_rejected",
    recipient: input.email,
    rendered,
  });
}

export { listByApplicationId as listEmailNotificationsByApplicationId } from "./notifications";
