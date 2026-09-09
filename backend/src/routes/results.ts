import { Hono } from "hono";
import { requireAuth } from "../auth";
import { getResultsPreview } from "../lib/results-preview";

export const resultsRoutes = new Hono();

resultsRoutes.use("*", requireAuth);

resultsRoutes.get("/preview", async (c) => {
  const preview = await getResultsPreview();
  return c.json(preview);
});
