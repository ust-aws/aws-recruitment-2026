import { AnimatePresence, m, type Transition, type Variants } from "motion/react"
import { PrivacyStep } from "@/components/apply/privacy-step"
import { GeneralInfoStep } from "@/components/apply/general-info-step"
import { CommitteeStep } from "@/components/apply/committee-step"
import { UploadStep } from "@/components/apply/upload-step"
import { ReviewStep } from "@/components/apply/review-step"
import { SuccessPanel } from "@/components/apply/success-panel"
import type {
  CommitteeValues,
  GeneralInfoValues,
  PrivacyValues,
  UploadValues,
} from "@/components/apply/apply-schema"

type FormStep = 1 | 2 | 3 | 4 | 5 | 6

type ApplyFormStepsProps = {
  step: FormStep
  direction: number
  variants: Variants
  transition: Transition
  serverError: string
  errorClasses: string
  privacy: PrivacyValues
  general: GeneralInfoValues
  committee: CommitteeValues
  upload: UploadValues
  updatePrivacy: (patch: Partial<PrivacyValues>) => void
  updateGeneral: (patch: Partial<GeneralInfoValues>) => void
  updateCommittee: (patch: Partial<CommitteeValues>) => void
  updateUpload: (patch: Partial<UploadValues>) => void
  currentStepErrors: {
    privacy: Partial<Record<keyof PrivacyValues, string>>
    general: Partial<Record<keyof GeneralInfoValues, string>>
    committee: Partial<Record<keyof CommitteeValues, string>>
    upload: Partial<Record<keyof UploadValues, string>>
  }
  applicationCode: string
  successApplicationType: "position" | "member"
  successChoices: {
    firstCommittee: string
    secondCommittee: string
    firstTitle: string
    secondTitle: string
  }
}

export function ApplyFormSteps({
  step,
  direction,
  variants,
  transition,
  serverError,
  errorClasses,
  privacy,
  general,
  committee,
  upload,
  updatePrivacy,
  updateGeneral,
  updateCommittee,
  updateUpload,
  currentStepErrors,
  applicationCode,
  successApplicationType,
  successChoices,
}: ApplyFormStepsProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <m.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
      >
        {step === 1 ? (
          <PrivacyStep
            values={privacy}
            onChange={updatePrivacy}
            errors={currentStepErrors.privacy}
          />
        ) : null}
        {step === 2 ? (
          <GeneralInfoStep
            values={general}
            onChange={updateGeneral}
            errors={currentStepErrors.general}
          />
        ) : null}
        {step === 3 ? (
          <CommitteeStep
            values={committee}
            onChange={updateCommittee}
            errors={currentStepErrors.committee}
          />
        ) : null}
        {step === 4 ? (
          <UploadStep
            values={upload}
            onChange={updateUpload}
            errors={currentStepErrors.upload}
          />
        ) : null}
        {step === 5 ? (
          <ReviewStep
            general={general}
            committee={committee}
            upload={upload}
            onGeneralChange={updateGeneral}
            onCommitteeChange={updateCommittee}
            onUploadChange={updateUpload}
            generalErrors={currentStepErrors.general}
            committeeErrors={currentStepErrors.committee}
            uploadErrors={currentStepErrors.upload}
          />
        ) : null}
        {step === 6 ? (
          <SuccessPanel
            applicationCode={applicationCode}
            applicationType={successApplicationType}
            firstChoiceCommittee={successChoices.firstCommittee}
            secondChoiceCommittee={successChoices.secondCommittee}
            firstChoiceTitle={successChoices.firstTitle}
            secondChoiceTitle={successChoices.secondTitle}
          />
        ) : null}
        {serverError ? (
          <p className={errorClasses} role="alert">{serverError}</p>
        ) : null}
      </m.div>
    </AnimatePresence>
  )
}
