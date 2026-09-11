import { Hono } from "hono";
import { requireAuth } from "../auth";
import {
  deliverResultNotifications,
  retryFailedResultEmails,
} from "../lib/result-email-delivery";
import {
  releaseResults,
  ResultsReleaseBlockedError,
} from "../lib/results-release";
import { getResultsPreview } from "../lib/results-preview";

export const resultsRoutes = new Hono();

resultsRoutes.use("*", requireAuth);

resultsRoutes.get("/preview", async (c) => {
  const preview = await getResultsPreview();
  return c.json(preview);
});

resultsRoutes.post("/release", async (c) => {
  try {
    const payload = c.get("jwtPayload") as { sub?: unknown };
    const release = await releaseResults(
      typeof payload.sub === "string" ? payload.sub : undefined,
    );
    const delivery = await deliverResultNotifications(
      release.notificationIds,
    );
    return c.json({
      ...release.summary,
      emailDelivery: {
        queued: release.notificationIds.length,
        ...delivery,
      },
    });
  } catch (error) {
    if (error instanceof ResultsReleaseBlockedError) {
      return c.json(
        { error: error.message, incomplete: error.incomplete },
        409,
      );
    }
    throw error;
  }
});

resultsRoutes.post("/emails/retry-failed", async (c) => {
  return c.json(await retryFailedResultEmails());
});
