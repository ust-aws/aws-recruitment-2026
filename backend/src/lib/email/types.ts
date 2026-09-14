export type EmailMessageType =
  | "application_submitted"
  | "applicant_otp"
  | "interview_booking"
  | "interview_reminder_24h"
  | "interview_reminder_1h"
  | "officer_application_notice"
  | "officer_first_choice_left"
  | "officer_first_choice_joined"
  | "officer_interview_rescheduled"
  | "applicant_dev_exam"
  | "member_registration"
  | "result_accepted"
  | "result_rejected";

export type EmailFileAttachment = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

export type EmailDeliveryStatus = "pending" | "sent" | "failed";

export type EmailInlineAttachment = {
  cid: string;
  mimeType: string;
  content: Buffer;
  filename?: string;
};

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
  inline?: EmailInlineAttachment[];
  attachments?: EmailFileAttachment[];
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  inline?: EmailInlineAttachment[];
  attachments?: EmailFileAttachment[];
};

export type SendEmailResult = {
  providerMessageId: string;
};

export type EmailNotificationJson = {
  id: string;
  applicationId: string | null;
  messageType: EmailMessageType;
  recipient: string;
  status: EmailDeliveryStatus;
  attempts: number;
  providerMessageId: string | null;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
};
