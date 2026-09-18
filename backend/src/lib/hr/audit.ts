export function logHrAudit(input: {
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
}) {
  console.info(
    JSON.stringify({
      type: "hr_audit",
      at: new Date().toISOString(),
      actorEmail: input.actorEmail ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
    }),
  );
}
