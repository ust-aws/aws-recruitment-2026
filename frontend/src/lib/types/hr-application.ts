import type {
  Application,
  ApplicationChoice,
} from "@/lib/types/application"

export type ChoiceDecisionStatus = "pending" | "approved" | "rejected"

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
