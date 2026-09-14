"use client"

import { CommitteeStep } from "@/components/apply/committee-step"
import { GeneralInfoStep } from "@/components/apply/general-info-step"
import { UploadStep } from "@/components/apply/upload-step"
import type { CommitteeValues, GeneralInfoValues, UploadValues } from "@/components/apply/apply-schema"

const stackClasses = "flex flex-col gap-10"
const sectionTitleClasses =
  "font-sans text-sm font-semibold uppercase tracking-wide text-biloba-flower"

type ReviewStepProps = {
  general: GeneralInfoValues
  committee: CommitteeValues
  upload: UploadValues
  onGeneralChange: (patch: Partial<GeneralInfoValues>) => void
  onCommitteeChange: (patch: Partial<CommitteeValues>) => void
  onUploadChange: (patch: Partial<UploadValues>) => void
  generalErrors?: Partial<Record<keyof GeneralInfoValues, string>>
  committeeErrors?: Partial<Record<keyof CommitteeValues, string>>
  uploadErrors?: Partial<Record<keyof UploadValues, string>>
}

export function ReviewStep({
  general,
  committee,
  upload,
  onGeneralChange,
  onCommitteeChange,
  onUploadChange,
  generalErrors,
  committeeErrors,
  uploadErrors,
}: ReviewStepProps) {
  return (
    <div className={stackClasses}>
      <section>
        <h3 className={sectionTitleClasses}>General information</h3>
        <div className="mt-4">
          <GeneralInfoStep values={general} onChange={onGeneralChange} errors={generalErrors} />
        </div>
      </section>
      <section>
        <h3 className={sectionTitleClasses}>Application type</h3>
        <div className="mt-4">
          <CommitteeStep values={committee} onChange={onCommitteeChange} errors={committeeErrors} />
        </div>
      </section>
      <section>
        <h3 className={sectionTitleClasses}>Documents</h3>
        <div className="mt-4">
          <UploadStep values={upload} onChange={onUploadChange} errors={uploadErrors} />
        </div>
      </section>
    </div>
  )
}
