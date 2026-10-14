import assert from "node:assert/strict"
import test from "node:test"
import type { DirectoryMember, PaymentListItem, PendingOfficer } from "../api/payments"
import { membersToCsv, unpaidToCsv } from "./csv"
import { buildMemberEntries, filterMemberEntries, splitByMemberId } from "./directory"
import { ADVISER_GROUP, buildCommitteeGroups, GENERAL_GROUP } from "./groups"
import { buildUnpaidEntries, countByUnpaidStatus, filterUnpaidEntries } from "./unpaid"
import { code128Bars } from "./barcode"
import { academicYearLabel, idCardValueSize, issuedOnLabel, validThroughLabel } from "./id-card"
import { idCardFileName } from "./id-card-export"

function member(patch: Partial<DirectoryMember>): DirectoryMember {
  return {
    memberId: "AWS-2627-0001",
    fullName: "Test Member",
    birthday: "2005-06-15",
    gender: "female",
    facebookUrl: "https://facebook.com/test.member",
    studentNumber: "2023100001",
    section: "3CSC",
    role: "general",
    position: "General Member",
    committee: null,
    verifiedAt: "2026-10-06T00:00:00.000Z",
    ...patch,
  }
}

function payment(patch: Partial<PaymentListItem>): PaymentListItem {
  return {
    paymentId: "p1",
    applicationId: "a1",
    applicationCode: "AP-2026-000001",
    applicationType: "position",
    applicationStatus: "approved",
    archivedAt: null,
    memberId: null,
    firstName: "Ana",
    lastName: "Cruz",
    email: "someone@ust.edu.ph",
    birthday: "2004-07-20",
    gender: "male",
    section: "4ITB",
    facebookUrl: "https://facebook.com/ana.cruz",
    status: "awaiting_payment",
    membershipStatus: "inactive",
    verifiedAt: null,
    resubmissionDeadlineAt: null,
    deadlineAt: "2026-10-20T00:00:00.000Z",
    finalPosition: "Finance Committee Staff",
    committee: "Finance Committee",
    latestSubmission: null,
    invitation: "sent",
    ...patch,
  }
}

test("paid members come first with their Member ID, then the officers with their office", () => {
  const entries = buildMemberEntries([
    member({ role: "staff", position: "Finance Committee Staff", committee: "Finance Committee" }),
  ])
  assert.equal(entries[0].memberId, "AWS-2627-0001")
  const first = entries[1]
  assert.equal(first.role, "eb")
  assert.equal(first.memberId, null)
  assert.match(first.committee ?? "", /^Office of the /)
  assert.ok(entries.some((entry) => entry.role === "director" && entry.committee?.endsWith("Committee")))
  const last = entries[0]
  assert.deepEqual(
    [last.memberId, last.committee, last.issuedAt],
    ["AWS-2627-0001", "Finance Committee", "2026-10-06T00:00:00.000Z"],
  )
  const split = splitByMemberId(entries)
  assert.equal(split.withId, 1)
  assert.equal(split.officers, entries.length - 1)
})

test("seeded officers show the number held for their seat until they pay", () => {
  const ceo: PendingOfficer = {
    fullName: "Sydney Alison Padua",
    birthday: null,
    gender: null,
    facebookUrl: null,
    position: "Chief Executive Officer",
    role: "eb",
    committee: "Office of the Chief Executive Officer",
    reservedMemberId: "AWS-2627-0001",
    applicationCode: "AP-2026-000123",
    studentNumber: null,
    section: null,
  }
  const adviser = member({
    memberId: "AWS-2627-9001",
    fullName: "Ronina Tayuan",
    role: "adviser",
    position: "Adviser",
    committee: null,
  })
  const entries = buildMemberEntries([adviser], [ceo])
  // Backend officers replace the static people list, so nobody is listed twice.
  assert.deepEqual(
    entries.map((entry) => [entry.fullName, entry.memberId, entry.reservedMemberId]),
    [
      ["Ronina Tayuan", "AWS-2627-9001", null],
      ["Sydney Alison Padua", null, "AWS-2627-0001"],
    ],
  )
  assert.equal(filterMemberEntries(entries, "all", "2627-0001").length, 1)
  assert.equal(filterMemberEntries(entries, "adviser", "").length, 1)
  assert.deepEqual(splitByMemberId(entries), { withId: 1, officers: 1 })
})

test("advisers get their own group ahead of the offices", () => {
  const groups = buildCommitteeGroups(
    buildMemberEntries([
      member({ memberId: "AWS-2627-9001", fullName: "Ronina Tayuan", role: "adviser", committee: null }),
      member({ memberId: "AWS-2627-0004", fullName: "Gil General" }),
    ]),
  )
  assert.equal(groups[0].name, ADVISER_GROUP)
  assert.equal(groups[groups.length - 1].name, GENERAL_GROUP)
})

test("search matches name, Member ID, student number and committee", () => {
  const entries = buildMemberEntries([
    member({ fullName: "Dana Reyes", committee: "Media Committee", role: "staff" }),
  ])
  assert.equal(filterMemberEntries(entries, "all", "dana").length, 1)
  assert.equal(filterMemberEntries(entries, "all", "2627-0001").length, 1)
  assert.equal(filterMemberEntries(entries, "all", "2023100001").length, 1)
  assert.ok(filterMemberEntries(entries, "all", "media committee").some((entry) => entry.fullName === "Dana Reyes"))
  assert.equal(filterMemberEntries(entries, "director", "dana").length, 0)
})

test("committee groups follow the organisation order, lead first, general members last", () => {
  const entries = buildMemberEntries([
    member({ memberId: "AWS-2627-0002", fullName: "Zed Staff", role: "staff", committee: "Finance Committee" }),
    member({
      memberId: "AWS-2627-0003",
      fullName: "Amy Assistant",
      role: "ea",
      committee: "Office of the Chief Finance Officer",
    }),
    member({ memberId: "AWS-2627-0004", fullName: "Gil General" }),
  ])
  const groups = buildCommitteeGroups(entries)
  assert.equal(groups[groups.length - 1].name, GENERAL_GROUP)
  assert.equal(groups[0].name, "Office of the Chief Executive Officer")
  const office = groups.find((group) => group.name === "Office of the Chief Finance Officer")
  assert.deepEqual([office?.leads[0]?.role, office?.members.map((person) => person.fullName)], ["eb", ["Amy Assistant"]])
  const committee = groups.find((group) => group.name === "Finance Committee")
  assert.deepEqual(
    [committee?.leads[0]?.role, committee?.members.map((person) => person.fullName), committee?.total],
    ["director", ["Zed Staff"], 2],
  )
  const officeAt = groups.findIndex((group) => group.name === "Office of the Chief Finance Officer")
  const committeeAt = groups.findIndex((group) => group.name === "Finance Committee")
  assert.ok(officeAt < committeeAt)
  // Offices and General members are top level; a committee sits under its office.
  assert.deepEqual([office?.level, committee?.level, groups[groups.length - 1].level], [0, 1, 0])
})

test("not-paid entries leave out paid and archived people and put who to chase first", () => {
  const entries = buildUnpaidEntries([
    payment({ paymentId: "v", status: "verified" }),
    payment({ paymentId: "arch", archivedAt: "2026-10-01T00:00:00.000Z" }),
    payment({ paymentId: "e", firstName: "Eli", lastName: "Expired", status: "expired" }),
    payment({ paymentId: "p", firstName: "Pia", lastName: "Pending", status: "pending_verification" }),
    payment({
      paymentId: "r",
      firstName: "Rey",
      lastName: "Resend",
      status: "needs_resubmission",
      resubmissionDeadlineAt: "2026-10-25T00:00:00.000Z",
    }),
    payment({ paymentId: "a", firstName: "Ana", lastName: "Awaiting", email: "ana@ust.edu.ph", applicationType: "member", finalPosition: null }),
  ])
  assert.deepEqual(entries.map((entry) => entry.key), ["a", "r", "p", "e"])
  assert.equal(entries[0].position, "General Member")
  assert.equal(entries[1].dueAt, "2026-10-25T00:00:00.000Z")
  assert.equal(entries[2].dueAt, "2026-10-20T00:00:00.000Z")
  const counts = countByUnpaidStatus(entries)
  assert.deepEqual([counts.all, counts.awaiting_payment, counts.expired], [4, 1, 1])
  assert.deepEqual(filterUnpaidEntries(entries, "pending_verification", "").map((entry) => entry.key), ["p"])
  assert.deepEqual(filterUnpaidEntries(entries, "all", "ana@").map((entry) => entry.key), ["a"])
})

test("CSV exports quote cells and guard against spreadsheet formulas", () => {
  const entries = buildMemberEntries([member({ fullName: "=SUM(A1)", position: 'Says "hi", twice' })])
  const csv = membersToCsv(entries.slice(0, 1))
  const [header, row] = csv.split("\r\n")
  assert.equal(header, '"Full name","Birthday","Gender","Facebook link","Year level","Course","Section","Position","Role","Committee","Member ID","Student number","ID issued"')
  assert.ok(row.startsWith(`"'=SUM`))
  assert.ok(row.includes('"Says ""hi"", twice"'))
  assert.ok(row.includes('"3rd Year","CS"'))
  const unpaid = unpaidToCsv(buildUnpaidEntries([payment({})]))
  assert.ok(unpaid.includes('"4th Year","IT"'))
  assert.ok(unpaid.split("\r\n")[1].includes('"Awaiting payment"'))
})

test("ID card labels read the academic year, expiry and Manila issue date", () => {
  assert.equal(academicYearLabel(2026), "2026-2027")
  assert.equal(validThroughLabel(2026), "May 31, 2027")
  // 20:00 UTC is already the next day in Manila.
  assert.equal(issuedOnLabel("2026-10-27T20:00:00.000Z"), "Issued on October 28, 2026")
  assert.equal(issuedOnLabel(null), "Issued this term")
})

test("ID card values step down a size as they get longer", () => {
  assert.equal(idCardValueSize("AWS-2627-0189"), "lg")
  assert.equal(idCardValueSize("Alden Alexander Olmedo"), "md")
  assert.equal(idCardValueSize("Executive Assistant to the Chief Relations Officer"), "sm")
  assert.equal(idCardValueSize("Executive Assistant to the Chief Technology Officer"), "xs")
})

test("ID card image files are named by member ID and side", () => {
  assert.equal(idCardFileName("AWS-2627-0189", "front"), "AWS-2627-0189-front.png")
  assert.equal(idCardFileName("AWS-2627-0189", "both"), "AWS-2627-0189-front-and-back.png")
})

test("ID card barcode merges adjacent dark modules into bars", () => {
  const { bars, modules } = code128Bars("AWS-2627-0015")
  // 11-module symbols then a 13-module stop that ends on a two-module bar.
  assert.equal((modules - 13) % 11, 0)
  assert.deepEqual(bars[0], { x: 0, width: 2 })
  assert.deepEqual(bars.at(-1), { x: modules - 2, width: 2 })
  assert.ok(bars.every((bar, index) => index === 0 || bar.x > bars[index - 1].x + bars[index - 1].width))
  assert.deepEqual(code128Bars("ÿ"), { bars: [], modules: 0 })
})
