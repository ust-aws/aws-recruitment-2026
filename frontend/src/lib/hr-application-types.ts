import type {
  Application,
  ApplicationChoice,
  ApplicationStatus,
} from "./application-types"

export type ChoiceDecisionStatus = ApplicationStatus

export type HrApplicationChoice = ApplicationChoice & {
  decisionStatus: ChoiceDecisionStatus
}

export type HrApplication = Omit<Application, "choices"> & {
  archivedAt: string | null
  choices: HrApplicationChoice[]
  finalPlacement: {
    positionId: string
    committee: string
    title: string
  } | null
}

export type UpdateApplicationDecisionInput = {
  positionId?: string
  decisionStatus?: Exclude<ChoiceDecisionStatus, "pending">
  finalPositionId?: string | null
}
