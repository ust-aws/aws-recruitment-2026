const bannerClasses =
  "rounded-[22px] border px-5 py-4 font-sans text-sm leading-relaxed"
const openClasses =
  "border-aquamarine/40 bg-aquamarine/10 text-blue-chalk"
const lockedClasses =
  "border-biloba-flower/35 bg-haiti/50 text-prelude"

type ApplicantEditBannerProps = {
  canEdit: boolean
  editDeadline: string | null
  lockReason: string | null
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function ApplicantEditBanner({
  canEdit,
  editDeadline,
  lockReason,
}: ApplicantEditBannerProps) {
  if (canEdit) {
    return (
      <p className={`${bannerClasses} ${openClasses}`}>
        You can change your committee choices until{" "}
        {editDeadline ? formatDeadline(editDeadline) : "the end of recruitment week"}.
      </p>
    )
  }

  return (
    <p className={`${bannerClasses} ${lockedClasses}`} role="status">
      {lockReason ?? "This application can no longer be edited."}
    </p>
  )
}
