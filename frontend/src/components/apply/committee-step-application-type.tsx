import { Button } from "@/components/ui/button"
import { Field } from "@/components/shared/field"
import type { CommitteeValues } from "@/components/apply/apply-schema"

const typeOptionsClasses = "grid gap-3 sm:grid-cols-2"
const typeButtonClasses = "h-auto min-h-20 justify-start px-4 py-3 text-left"
const typeTitleClasses = "block font-sans text-sm font-semibold"
const typeDescriptionClasses =
  "mt-1 block font-sans text-xs leading-relaxed opacity-85"

type CommitteeStepApplicationTypeProps = {
  positionApplication: boolean
  onSelect: (applicationType: CommitteeValues["applicationType"]) => void
}

export function CommitteeStepApplicationType({
  positionApplication,
  onSelect,
}: CommitteeStepApplicationTypeProps) {
  return (
    <Field label="How would you like to apply?" required>
      <div className={typeOptionsClasses} role="radiogroup">
        <Button
          type="button"
          color={positionApplication ? "cyan" : "purple"}
          variant={positionApplication ? "default" : "outline"}
          className={typeButtonClasses}
          role="radio"
          aria-checked={positionApplication}
          onClick={() => onSelect("position")}
        >
          <span>
            <span className={typeTitleClasses}>Committee position</span>
            <span className={typeDescriptionClasses}>
              Choose two positions and an interview schedule.
            </span>
          </span>
        </Button>
        <Button
          type="button"
          color={!positionApplication ? "cyan" : "purple"}
          variant={!positionApplication ? "default" : "outline"}
          className={typeButtonClasses}
          role="radio"
          aria-checked={!positionApplication}
          onClick={() => onSelect("member")}
        >
          <span>
            <span className={typeTitleClasses}>Member-only</span>
            <span className={typeDescriptionClasses}>
              Join without applying for a committee position or interview.
            </span>
          </span>
        </Button>
      </div>
    </Field>
  )
}
