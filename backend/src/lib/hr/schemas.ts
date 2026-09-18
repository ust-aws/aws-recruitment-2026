import { z } from "zod";
import { hasControlCharacters } from "../core/text-sanitize";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isoTimestamp = z
  .string()
  .refine(
    (value) =>
      value.includes("T") && /(Z|[+-][0-9]{2}:[0-9]{2})$/.test(value),
    { error: "Must be an ISO timestamp with a timezone." },
  )
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    error: "Must be a valid timestamp.",
  });

const safeText = (maxLength: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => !hasControlCharacters(value), {
      error: "Text contains invalid control characters.",
    })
    .pipe(z.string().max(maxLength, { error: `Text must be at most ${maxLength} characters.` }));

export const positionCreateSchema = z.object({
  title: safeText(150).pipe(z.string().min(1, { error: "title is required." })),
  committee_id: z.string().trim().regex(UUID_RE, {
    error: "committee_id must be a UUID.",
  }),
  description: safeText(10_000).optional().default(""),
  responsibilities: safeText(10_000).optional().default(""),
});

export const positionPatchSchema = z
  .object({
    title: safeText(150).pipe(z.string().min(1)).optional(),
    committee_id: z
      .string()
      .trim()
      .regex(UUID_RE, { error: "committee_id must be a UUID." })
      .optional(),
    description: safeText(10_000).optional(),
    responsibilities: safeText(10_000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    error: "At least one field is required.",
  });

export const interviewSlotCreateSchema = z.object({
  committeeId: z.string().trim().regex(UUID_RE, {
    error: "committeeId must be a UUID.",
  }),
  startsAt: isoTimestamp,
});

export const interviewSlotPatchSchema = z.object({
  isOpen: z.boolean({ error: "isOpen must be a boolean." }),
});

export const recruitmentWindowPatchSchema = z.object({
  startsAt: isoTimestamp,
  endsAt: isoTimestamp,
});

export const interviewWindowPatchSchema = recruitmentWindowPatchSchema;

export const applicationDecisionPatchSchema = z
  .object({
    positionId: z.string().trim().regex(UUID_RE).optional(),
    decisionStatus: z.enum(["approved", "rejected"]).optional(),
    finalPositionId: z
      .union([z.string().trim().regex(UUID_RE), z.null()])
      .optional(),
  })
  .superRefine((body, ctx) => {
    const hasPositionId = body.positionId !== undefined;
    const hasDecisionStatus = body.decisionStatus !== undefined;
    const changesChoice = hasPositionId && hasDecisionStatus;
    const changesFinalPlacement = body.finalPositionId !== undefined;

    if (hasPositionId !== hasDecisionStatus) {
      ctx.addIssue({
        code: "custom",
        message: "positionId and decisionStatus must be provided together.",
      });
    }
    if (!changesChoice && !changesFinalPlacement) {
      ctx.addIssue({
        code: "custom",
        message: "Provide a committee decision or finalPositionId.",
      });
    }
  });

export const applicationArchivePatchSchema = z.object({
  archived: z.boolean({ error: "archived must be a boolean." }),
});

export function zodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request body.";
}
