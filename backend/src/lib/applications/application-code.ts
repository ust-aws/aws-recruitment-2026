function recruitmentYearString(): string {
  return String(recruitmentYearInt());
}

export function recruitmentYearInt(): number {
  const raw = process.env.RECRUITMENT_YEAR ?? "2026";
  const year = Number(raw);
  return Number.isInteger(year) && year >= 2000 && year <= 9999 ? year : 2026;
}

export function generateApplicationCodeSuffix(length = 6): string {
  const max = 10 ** length;
  const value = Math.floor(Math.random() * max);
  return value.toString().padStart(length, "0");
}

export function formatApplicationCode(suffix: string): string {
  return `AP-${recruitmentYearString()}-${suffix}`;
}

export function generateApplicationCode(): string {
  return formatApplicationCode(generateApplicationCodeSuffix());
}
