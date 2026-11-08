"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CommitteeApplicationStatus } from "@/lib/api/client"
import {
  savePaymentSchedule,
  type PaymentCampaign,
} from "@/lib/api/payments"
import {
  compareCommitteeNames,
  isExecutiveOfficeCommittee,
} from "@/lib/apply/committee-groups"
import { formatSubheaderLabel } from "@/lib/site/button-label"
import { subheaderLabelClasses } from "@/lib/site/surface"

const gridClasses = "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
const fieldClasses = "flex flex-col gap-2"
const fullFieldClasses = "flex flex-col gap-2 md:col-span-2 xl:col-span-3"
const sectionClasses = "mt-5 border-t border-blue-chalk/15 pt-5"
const helpClasses = "font-sans text-xs leading-relaxed text-prelude"
const sectionTitleClasses = "mb-4 font-sans text-sm font-semibold text-biloba-flower"
const errorClasses = "mt-3 font-sans text-sm text-rose-glow"

/** Executive offices first, then committees, each in org hierarchy order. */
function inHierarchyOrder(committees: CommitteeApplicationStatus[]) {
  return [...committees].sort((a, b) => {
    const officeRank =
      Number(isExecutiveOfficeCommittee(b.name)) -
      Number(isExecutiveOfficeCommittee(a.name))
    return officeRank || compareCommitteeNames(a.name, b.name)
  })
}

function defaults(campaign: PaymentCampaign) {
  return {
    generalChatLink: campaign.generalChatLink ?? "",
    coreTeamChatLink: campaign.coreTeamChatLink ?? "",
    committeeLinks: Object.fromEntries(
      campaign.committeeChatLinks.map((link) => [link.committeeId, link.chatLink]),
    ) as Record<string, string>,
  }
}

type LinksFormProps = {
  campaign: PaymentCampaign
  committees: CommitteeApplicationStatus[]
  onSaved: (campaign: PaymentCampaign) => void
}

export function HrPaymentLinksForm({ campaign, committees, onSaved }: LinksFormProps) {
  const [form, setForm] = useState(() => defaults(campaign))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    setPending(true)
    setError("")
    try {
      const saved = await savePaymentSchedule({
        opensAt: campaign.opensAt,
        deadlineAt: campaign.deadlineAt,
        generalChatLink: form.generalChatLink.trim() || null,
        coreTeamChatLink: form.coreTeamChatLink.trim() || null,
        committeeChatLinks: committees.flatMap((committee) => {
          const chatLink = form.committeeLinks[committee.id]?.trim()
          return chatLink ? [{ committeeId: committee.id, chatLink }] : []
        }),
      })
      onSaved(saved)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the community links.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <p className={sectionTitleClasses}>Members Facebook Page</p>
      <div className={gridClasses}>
        <div className={fullFieldClasses}>
          <FieldLabel htmlFor="members-fb-group">Members Facebook group</FieldLabel>
          <Input
            id="members-fb-group"
            type="url"
            inputMode="url"
            placeholder="https://www.facebook.com/groups/…"
            value={form.generalChatLink}
            onChange={(event) =>
              setForm((current) => ({ ...current, generalChatLink: event.target.value }))
            }
          />
        </div>
      </div>
      <div className={sectionClasses}>
        <p className={sectionTitleClasses}>Core Team Group Chat</p>
        <div className={gridClasses}>
          <div className={fullFieldClasses}>
            <FieldLabel htmlFor="core-team-chat">Core team group chat</FieldLabel>
            <Input
              id="core-team-chat"
              type="url"
              inputMode="url"
              placeholder="https://m.me/j/…"
              value={form.coreTeamChatLink}
              onChange={(event) =>
                setForm((current) => ({ ...current, coreTeamChatLink: event.target.value }))
              }
            />
          </div>
        </div>
        <p className={`${helpClasses} mt-3`}>
          For the Executive Board, Executive Associates and Directors. Accepted Executive
          Associates see this link on their dashboard.
        </p>
      </div>
      <div className={sectionClasses}>
        <p className={sectionTitleClasses}>Office and Committee Group Chats</p>
        <div className={gridClasses}>
          {inHierarchyOrder(committees).map((committee) => (
            <div key={committee.id} className={fieldClasses}>
              <FieldLabel htmlFor={`chat-${committee.id}`}>{committee.name}</FieldLabel>
              <Input id={`chat-${committee.id}`} type="url" value={form.committeeLinks[committee.id] ?? ""} onChange={(event) => setForm((current) => ({ ...current, committeeLinks: { ...current.committeeLinks, [committee.id]: event.target.value } }))} />
            </div>
          ))}
        </div>
        <p className={`${helpClasses} mt-3`}>
          Accepted applicants receive the group chat link for their office or committee.
        </p>
      </div>
      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
      <Button type="button" className="mt-5" disabled={pending} onClick={() => void save()}>{pending ? "Saving…" : "Save community links"}</Button>
    </div>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className={subheaderLabelClasses}>
      {formatSubheaderLabel(children)}
    </label>
  )
}
