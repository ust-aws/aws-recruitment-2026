/** Applicant access code — sent only after matching an Application ID and email. */
export function applicantOtpSubject(applicationCode: string): string {
  return `AWS Builders - UST | Verification Code (${applicationCode})`;
}

/** Application submitted — includes the public Application ID. */
export function applicationSubmittedSubject(applicationCode: string): string {
  return `AWS Builders - UST | Application Received (${applicationCode})`;
}

export function applicantInterviewBookingSubject(
  applicationCode: string,
): string {
  return `AWS Builders - UST | Interview Schedule Updated (${applicationCode})`;
}

export function applicantInterviewReminderSubject(
  applicationCode: string,
): string {
  return `AWS Builders - UST | Interview Reminder (${applicationCode})`;
}

export function officerApplicationNoticeSubject(input: {
  firstName: string;
  lastName: string;
  firstChoiceCommittee: string;
}): string {
  const applicant = `${input.firstName} ${input.lastName}`;
  if (input.firstChoiceCommittee.startsWith("Office of the ")) {
    return `New EA Applicant For Your Office — ${applicant} | R101`;
  }
  return `New ${input.firstChoiceCommittee} Staff Applicant — ${applicant} | R101`;
}

export function officerFirstChoiceLeftSubject(input: {
  firstName: string;
  lastName: string;
  firstChoiceCommittee: string;
}): string {
  const applicant = `${input.firstName} ${input.lastName}`;
  if (input.firstChoiceCommittee.startsWith("Office of the ")) {
    return `First-Choice Change — ${applicant} Is No Longer Listing Your Office | R101`;
  }
  return `First-Choice Change — ${applicant} Is No Longer Listing Your ${input.firstChoiceCommittee} | R101`;
}

export function officerFirstChoiceJoinedSubject(input: {
  firstName: string;
  lastName: string;
  firstChoiceCommittee: string;
}): string {
  const applicant = `${input.firstName} ${input.lastName}`;
  if (input.firstChoiceCommittee.startsWith("Office of the ")) {
    return `First-Choice Change — ${applicant} Now Listed Your Office | R101`;
  }
  return `First-Choice Change — ${applicant} Now Listed ${input.firstChoiceCommittee} | R101`;
}

export function officerInterviewRescheduledSubject(input: {
  firstName: string;
  lastName: string;
}): string {
  return `Interview Time Change — ${input.firstName} ${input.lastName} | R101`;
}

export function applicantDevExamSubject(applicationCode: string): string {
  return `AWS Builders - UST | Exam Specifications (${applicationCode})`;
}

export function memberRegistrationSubject(applicationCode: string): string {
  return `AWS Builders - UST | Membership Registration (${applicationCode})`;
}

/** Accepted result (Marc #10 Release Results). */
export const resultAcceptedSubject =
  "Welcome Aboard! Your AWS Builders - UST R101 Results";

/** Rejected result (Marc #10 Release Results). */
export const resultRejectedSubject =
  "AWS Builders - UST R101 Recruitment Results";
