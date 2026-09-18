/** Committees under Chief Creatives Officer (apply-form portfolio rule). */
const CREATIVES_COMMITTEES = new Set([
  "Office of the Chief Creative Officer",
  "Documentation Committee",
  "Media Committee",
  "Publicity Committee",
]);

export const CTO_EA_POSITION_TITLE = "Executive Assistant to the CTO";

export function isCreativesCommittee(name: string): boolean {
  return CREATIVES_COMMITTEES.has(name);
}

export function isDevelopmentCommittee(name: string): boolean {
  return name === "Development Committee";
}

export function isCtoExecutiveAssistant(title: string): boolean {
  return title === CTO_EA_POSITION_TITLE;
}

export function needsGithubForChoice(committee: string, title: string): boolean {
  return isDevelopmentCommittee(committee) || isCtoExecutiveAssistant(title);
}

export type ChoiceRef = { committee: string; title: string };

export function choiceRequiresDevExam(choice: ChoiceRef): boolean {
  return needsGithubForChoice(choice.committee, choice.title);
}

export function applicationRequiresDevExam(choices: ChoiceRef[]): boolean {
  return choices.some(choiceRequiresDevExam);
}

export function newlyRequiresDevExam(
  previous: ChoiceRef[],
  next: ChoiceRef[],
): boolean {
  return !applicationRequiresDevExam(previous) && applicationRequiresDevExam(next);
}

export function officerFirstChoiceShowsPortfolio(
  firstChoice: ChoiceRef,
): boolean {
  return isCreativesCommittee(firstChoice.committee);
}

export function officerFirstChoiceShowsGithub(
  firstChoice: ChoiceRef,
): boolean {
  return needsGithubForChoice(firstChoice.committee, firstChoice.title);
}
