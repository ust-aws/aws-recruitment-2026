import { sendDueInterviewReminders } from "./lib/interview/reminders";

export async function handler() {
  const result = await sendDueInterviewReminders();
  console.info("[interview-reminders] run complete", result);
  return result;
}
