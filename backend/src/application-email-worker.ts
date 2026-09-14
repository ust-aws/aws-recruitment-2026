import { getApplicationById } from "./lib/applications";
import {
  sendApplicationSubmitted,
  sendOfficerApplicationNotice,
} from "./lib/email/service";

type ApplicationEmailEvent = {
  applicationId?: unknown;
};

export async function handler(event: ApplicationEmailEvent) {
  if (typeof event.applicationId !== "string") {
    throw new Error("Application email job is missing an application ID.");
  }

  const application = await getApplicationById(event.applicationId);
  if (!application) {
    console.info(
      `[application-email] skipped deleted application ${event.applicationId}`,
    );
    return;
  }

  const results = await Promise.allSettled([
    sendApplicationSubmitted(application),
    sendOfficerApplicationNotice(application),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[application-email] delivery failed", result.reason);
    }
  }
}