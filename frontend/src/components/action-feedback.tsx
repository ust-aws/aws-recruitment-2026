const successClasses =
  "mt-3 rounded-[14px] border border-aquamarine/40 bg-aquamarine/10 px-4 py-3 font-sans text-sm text-blue-chalk"
const errorClasses =
  "mt-3 rounded-[14px] border border-rose-blush/45 bg-rose-deep/20 px-4 py-3 font-sans text-sm text-rose-glow"

type ActionFeedbackProps = {
  type: "success" | "error"
  message: string
  className?: string
}

export function ActionFeedback({ type, message, className }: ActionFeedbackProps) {
  if (!message) return null

  const classes = type === "success" ? successClasses : errorClasses

  return (
    <p
      className={className ? `${classes} ${className}` : classes}
      role={type === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  )
}
