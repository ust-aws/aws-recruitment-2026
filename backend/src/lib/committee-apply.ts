/** Committees under Chief Creatives Officer (apply-form portfolio rule). */
const CREATIVES_COMMITTEES = new Set([
  "Office of the Chief Creative Officer",
  "Documentation Committee",
  "Media Committee",
  "Publicity Committee",
]);

export function isCreativesCommittee(name: string): boolean {
  return CREATIVES_COMMITTEES.has(name);
}

export function isDevelopmentCommittee(name: string): boolean {
  return name === "Development Committee";
}
