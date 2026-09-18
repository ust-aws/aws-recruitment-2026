import {
  COMMITTEE_IDS,
  COMMITTEES,
  QUESTIONS,
  type CommitteeId,
  type ScoreKey,
} from "@/lib/quiz/data"

export const EA_THRESHOLD = 10
const COMMITTEE_ORDER = new Map(COMMITTEE_IDS.map((id, index) => [id, index]))

const OFFICER_BY_COMMITTEE: Record<CommitteeId, string> = {
  logistics: "Chief Operating Officer",
  "community-development": "Chief Operating Officer",
  "external-affairs": "Chief Relations Officer",
  sponsorships: "Chief Relations Officer",
  marketing: "Chief Relations Officer",
  secretariat: "Corporate Secretary",
  documentation: "Chief Creative Officer",
  development: "Chief Technology Officer",
  technicals: "Chief Technology Officer",
  finance: "Chief Finance Officer",
  "human-resources": "Chief Human Resources Officer",
  publications: "Chief Creative Officer",
  media: "Chief Creative Officer",
}

export type QuizResult = {
  primary: CommitteeId[]
  alsoCompatible: CommitteeId[]
  executiveAssistant: { officer: string } | null
}

function emptyScores(): Record<ScoreKey, number> {
  const scores = {
    "executive-assistant": 0,
  } as Record<ScoreKey, number>
  for (const id of COMMITTEE_IDS) scores[id] = 0
  return scores
}

function takeTopGroups(ranked: { id: CommitteeId; score: number }[]) {
  const groups: CommitteeId[][] = []
  let currentScore: number | null = null
  let bucket: CommitteeId[] = []
  for (const row of ranked) {
    if (currentScore === null || row.score === currentScore) {
      bucket.push(row.id)
      currentScore = row.score
      continue
    }
    groups.push(bucket)
    bucket = [row.id]
    currentScore = row.score
  }
  if (bucket.length) groups.push(bucket)

  const primary = groups[0] ?? []
  const alsoCompatible: CommitteeId[] = []
  for (const group of groups.slice(1)) {
    if (primary.length + alsoCompatible.length >= 3) break
    alsoCompatible.push(...group)
  }
  return { primary, alsoCompatible }
}

function officerFor(
  scores: Record<ScoreKey, number>,
  primary: CommitteeId[],
  alsoCompatible: CommitteeId[]
) {
  const top = [...primary, ...alsoCompatible]
  const buckets = new Set(top.map((id) => OFFICER_BY_COMMITTEE[id]))
  if (buckets.size >= 3) return "Chief Executive Officer"

  const lead = primary[0]
  if (lead === "community-development") {
    return scores["human-resources"] >= scores.logistics
      ? "Chief Human Resources Officer"
      : "Chief Operating Officer"
  }
  return OFFICER_BY_COMMITTEE[lead]
}

export function scoreQuiz(optionIds: string[]): QuizResult {
  const scores = emptyScores()
  QUESTIONS.forEach((question, index) => {
    const option = question.options.find((item) => item.id === optionIds[index])
    if (!option) return
    for (const [key, value] of Object.entries(option.scores)) {
      scores[key as ScoreKey] += value ?? 0
    }
  })

  const ranked = COMMITTEE_IDS.map((id) => ({ id, score: scores[id] })).sort(
    (a, b) => b.score - a.score || COMMITTEE_ORDER.get(a.id)! - COMMITTEE_ORDER.get(b.id)!
  )
  const { primary, alsoCompatible } = takeTopGroups(ranked)

  return {
    primary,
    alsoCompatible,
    executiveAssistant:
      scores["executive-assistant"] >= EA_THRESHOLD
        ? { officer: officerFor(scores, primary, alsoCompatible) }
        : null,
  }
}

export function committeeName(id: CommitteeId) {
  return COMMITTEES[id].name
}
