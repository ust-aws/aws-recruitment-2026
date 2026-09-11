"use client"

import { CommitteeStep, type CommitteeValues } from "@/components/apply/committee-step"
import { GeneralInfoStep, type GeneralInfoValues } from "@/components/apply/general-info-step"
import { UploadStep, type UploadValues } from "@/components/apply/upload-step"

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
}

export function ReviewStep({
  general,
  committee,
  upload,
  onGeneralChange,
  onCommitteeChange,
  onUploadChange,
}: ReviewStepProps) {
  return (
    <div className={stackClasses}>
      <section>
        <h3 className={sectionTitleClasses}>General information</h3>
        <div className="mt-4">
          <GeneralInfoStep values={general} onChange={onGeneralChange} />
        </div>
      </section>
      <section>
        <h3 className={sectionTitleClasses}>Committee choices</h3>
        <div className="mt-4">
          <CommitteeStep values={committee} onChange={onCommitteeChange} />
        </div>
      </section>
      <section>
        <h3 className={sectionTitleClasses}>Documents</h3>
        <div className="mt-4">
          <UploadStep values={upload} onChange={onUploadChange} />
        </div>
      </section>
    </div>
  )
}
