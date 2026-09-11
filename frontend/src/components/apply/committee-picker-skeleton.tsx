import { Skeleton } from "@/components/ui/skeleton"

const fieldStackClasses = "flex flex-col gap-5"
const fieldBlockClasses = "flex flex-col gap-2"

type CommitteePickerSkeletonProps = {
  fields?: number
}

export function CommitteePickerSkeleton({
  fields = 2,
}: CommitteePickerSkeletonProps) {
  return (
    <div
      className={fieldStackClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading committee options"
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className={fieldBlockClasses}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-[14px]" />
        </div>
      ))}
    </div>
  )
}
