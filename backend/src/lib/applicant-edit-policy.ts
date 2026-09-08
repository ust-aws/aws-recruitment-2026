type ApplicationState = {
  status: "pending" | "approved" | "rejected";
  archivedAt: Date | null;
  resultsReleasedAt: Date | null;
};

type ChoiceState = {
  decisionStatus: "pending" | "approved" | "rejected";
};

export type ApplicantEditBlockCode =
  | "archived"
  | "results_released"
  | "application_closed"
  | "review_started"
  | "choices_incomplete"
  | "deadline_unavailable"
  | "deadline_passed";

export type ApplicantEditEligibility = {
  canEdit: boolean;
  editDeadline: string | null;
  lockReason: string | null;
  blockCode: ApplicantEditBlockCode | null;
};

function configuredDeadline(): Date | null {
  const raw = process.env.APPLICATION_EDIT_DEADLINE?.trim();
  if (!raw) return null;
  const deadline = new Date(raw);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
}

export function getApplicantEditEligibility(
  application: ApplicationState,
  choices: ChoiceState[],
  now = new Date(),
): ApplicantEditEligibility {
  const deadline = configuredDeadline();
  const editDeadline = deadline?.toISOString() ?? null;
  const blocked = (
    blockCode: ApplicantEditBlockCode,
    lockReason: string,
  ): ApplicantEditEligibility => ({
    canEdit: false,
    editDeadline,
    lockReason,
    blockCode,
  });

  if (application.archivedAt) {
    return blocked("archived", "This application is archived.");
  }
  if (application.resultsReleasedAt) {
    return blocked(
      "results_released",
      "This application can no longer be edited because results were released.",
    );
  }
  if (application.status !== "pending") {
    return blocked(
      "application_closed",
      "This application can no longer be edited.",
    );
  }
  if (choices.length !== 2) {
    return blocked(
      "choices_incomplete",
      "Application editing is unavailable because its choices are incomplete.",
    );
  }
  if (choices.some((choice) => choice.decisionStatus !== "pending")) {
    return blocked(
      "review_started",
      "Application editing is locked because HR review has started.",
    );
  }
  if (!deadline) {
    return blocked(
      "deadline_unavailable",
      "Application editing is not configured.",
    );
  }
  if (now.getTime() >= deadline.getTime()) {
    return blocked(
      "deadline_passed",
      "The application editing deadline has passed.",
    );
  }

  return {
    canEdit: true,
    editDeadline,
    lockReason: null,
    blockCode: null,
  };
}
