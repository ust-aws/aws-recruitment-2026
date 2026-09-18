import { getApplicationById } from "../applications/applications";
import type { ChoiceRef } from "../apply/committee";
import { newlyRequiresDevExam } from "../apply/committee";
import { getBookedInterviewStartsAt } from "../interview/scheduling";
import { lookupOfficerRecipient } from "./officer-recipients";
import {
  applicantDevExamTemplate,
  officerFirstChoiceJoinedTemplate,
  officerFirstChoiceLeftTemplate,
  officerInterviewRescheduledTemplate,
} from "./officer-edit-templates";
import { loadOfficerApplicantAttachments } from "./officer-email-attachments";
import type { EmailMessageType, RenderedEmail } from "./types";

export type OfficerEditEmailDeliverer = (input: {
  applicationId: string;
  messageType: EmailMessageType;
  recipient: string;
  rendered: RenderedEmail;
}) => Promise<void>;

export type ApplicantDevExamDeliverer = (
  applicationId: string,
  application: {
    lastName: string;
    email: string;
    applicationCode: string;
  },
  choices: ChoiceRef[],
) => Promise<void>;

export type ApplicantEditEmailSnapshot = {
  previousFirstCommittee: string;
  previousChoices: ChoiceRef[];
  previousInterviewStartsAt: Date | null;
};

export async function loadApplicantEditEmailSnapshot(
  applicationId: string,
): Promise<ApplicantEditEmailSnapshot | null> {
  const application = await getApplicationById(applicationId);
  if (!application) return null;

  const first = application.choices.find((choice) => choice.preferenceRank === 1);
  const second = application.choices.find((choice) => choice.preferenceRank === 2);
  if (!first || !second) return null;

  const previousInterviewStartsAt =
    await getBookedInterviewStartsAt(applicationId);

  return {
    previousFirstCommittee: first.committee,
    previousChoices: [
      { committee: first.committee, title: first.title },
      { committee: second.committee, title: second.title },
    ],
    previousInterviewStartsAt,
  };
}

function choiceRefsFromApplication(
  choices: {
    preferenceRank: number;
    committee: string;
    title: string;
  }[],
): ChoiceRef[] {
  const first = choices.find((choice) => choice.preferenceRank === 1);
  const second = choices.find((choice) => choice.preferenceRank === 2);
  if (!first || !second) return [];
  return [
    { committee: first.committee, title: first.title },
    { committee: second.committee, title: second.title },
  ];
}

export async function notifyOfficersAfterApplicantChoiceEdit(
  applicationId: string,
  snapshot: ApplicantEditEmailSnapshot,
  deliver: {
    officerEmail: OfficerEditEmailDeliverer;
    applicantDevExam: ApplicantDevExamDeliverer;
  },
): Promise<void> {
  const application = await getApplicationById(applicationId);
  if (!application) return;

  const first = application.choices.find((choice) => choice.preferenceRank === 1);
  const second = application.choices.find((choice) => choice.preferenceRank === 2);
  if (!first || !second) return;

  const interviewStartsAt = await getBookedInterviewStartsAt(applicationId);
  const newChoiceRefs = choiceRefsFromApplication(application.choices);
  const committeeChanged =
    snapshot.previousFirstCommittee !== first.committee;

  if (committeeChanged) {
    const previousFirst = snapshot.previousChoices[0];
    const newFirst: ChoiceRef = { committee: first.committee, title: first.title };
    const newSecond: ChoiceRef = {
      committee: second.committee,
      title: second.title,
    };

    const previousOfficer = lookupOfficerRecipient(snapshot.previousFirstCommittee);
    if (previousOfficer) {
      const rendered = officerFirstChoiceLeftTemplate({
        officerLastName: previousOfficer.lastName,
        applicantFirstName: application.firstName,
        applicantLastName: application.lastName,
        previousFirstChoice: previousFirst,
        newFirstChoice: newFirst,
      });
      await deliver.officerEmail({
        applicationId,
        messageType: "officer_first_choice_left",
        recipient: previousOfficer.email,
        rendered,
      });
    }

    const newOfficer = lookupOfficerRecipient(first.committee);
    if (!newOfficer) {
      console.info(
        `[email] skipped officer_first_choice_joined for application ${applicationId} (unknown committee: ${first.committee})`,
      );
    } else if (!application.studentNumber?.trim()) {
      console.info(
        `[email] skipped officer_first_choice_joined for application ${applicationId} (missing student number)`,
      );
    } else if (!interviewStartsAt) {
      console.info(
        `[email] skipped officer_first_choice_joined for application ${applicationId} (no interview slot)`,
      );
    } else {
      const attachments = await loadOfficerApplicantAttachments(applicationId);
      const rendered = officerFirstChoiceJoinedTemplate({
        officerLastName: newOfficer.lastName,
        applicantFirstName: application.firstName,
        applicantLastName: application.lastName,
        studentNumber: application.studentNumber.trim(),
        email: application.email,
        applicationCode: application.applicationCode,
        portfolioUrl: application.portfolioUrl,
        githubUrl: application.githubUrl,
        firstChoice: newFirst,
        secondChoice: newSecond,
        interviewStartsAt,
      });
      rendered.attachments =
        attachments.length > 0 ? attachments : undefined;
      await deliver.officerEmail({
        applicationId,
        messageType: "officer_first_choice_joined",
        recipient: newOfficer.email,
        rendered,
      });
    }

    if (newlyRequiresDevExam(snapshot.previousChoices, newChoiceRefs)) {
      await deliver.applicantDevExam(
        applicationId,
        {
          lastName: application.lastName,
          email: application.email,
          applicationCode: application.applicationCode,
        },
        newChoiceRefs,
      );
    }
    return;
  }

  if (!interviewStartsAt) return;

  const previousTime = snapshot.previousInterviewStartsAt?.getTime() ?? null;
  const newTime = interviewStartsAt.getTime();
  if (previousTime === null || previousTime === newTime) return;

  const officer = lookupOfficerRecipient(first.committee);
  if (!officer) return;

  const rendered = officerInterviewRescheduledTemplate({
    officerLastName: officer.lastName,
    applicantFirstName: application.firstName,
    applicantLastName: application.lastName,
    interviewStartsAt,
  });
  await deliver.officerEmail({
    applicationId,
    messageType: "officer_interview_rescheduled",
    recipient: officer.email,
    rendered,
  });
}

export async function notifyOfficerAfterInterviewReschedule(
  applicationId: string,
  previousInterviewStartsAt: Date | null,
  deliver: OfficerEditEmailDeliverer,
): Promise<void> {
  const application = await getApplicationById(applicationId);
  if (!application) return;

  const first = application.choices.find((choice) => choice.preferenceRank === 1);
  if (!first) return;

  const interviewStartsAt = await getBookedInterviewStartsAt(applicationId);
  if (!interviewStartsAt) return;

  const officer = lookupOfficerRecipient(first.committee);
  if (!officer) {
    console.info(
      `[email] skipped officer_interview_rescheduled for application ${applicationId} (unknown committee: ${first.committee})`,
    );
    return;
  }

  const rendered = officerInterviewRescheduledTemplate({
    officerLastName: officer.lastName,
    applicantFirstName: application.firstName,
    applicantLastName: application.lastName,
    interviewStartsAt,
  });
  await deliver({
    applicationId,
    messageType: "officer_interview_rescheduled",
    recipient: officer.email,
    rendered,
  });
}
