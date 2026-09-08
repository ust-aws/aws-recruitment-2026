/** Applicant access code — sent only after matching an Application ID and email. */
export function applicantOtpSubject(applicationCode: string): string {
  return `AWS Builders - UST | Verification code (${applicationCode})`;
}

/** Application submitted — includes the public Application ID. */
export function applicationSubmittedSubject(applicationCode: string): string {
  return `AWS Builders - UST | Application received (${applicationCode})`;
}

/** Accepted result (Marc #10 Release Results). */
export const resultAcceptedSubject =
  "Welcome Aboard! Your AWS Builders - UST R1O1 Results";

/** Rejected result (Marc #10 Release Results). */
export const resultRejectedSubject =
  "AWS Builders - UST R1O1 Recruitment Results";
