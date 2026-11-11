/** Whole years old on `today`, from a YYYY-MM-DD birthday. */
export function ageOn(birthday: string, today: Date) {
  const [year, month, day] = birthday.split("-").map(Number);
  const hadBirthday = today.getUTCMonth() + 1 > month || (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  return today.getUTCFullYear() - year - (hadBirthday ? 0 : 1);
}
