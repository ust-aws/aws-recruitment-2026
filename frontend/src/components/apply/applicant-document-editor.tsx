"use client"

import { useState } from "react"
import { PdfFileDrop } from "@/components/apply/pdf-file-drop"
import { Button } from "@/components/ui/button"
import {
  documentFileNameFormatExample,
  documentFileNameMatches,
} from "@/lib/apply-field-validation"
import { updateApplicantDocuments } from "@/lib/applicant-api"
import type { ApplicantApplication, ApplicantDocument } from "@/lib/applicant-api"
import type { DocumentType } from "@/lib/application-types"

const stackClasses = "mt-8 flex flex-col gap-5"
const headingClasses = "font-sans text-sm font-semibold text-biloba-flower"
const hintClasses = "font-sans text-xs text-prelude"
const errorClasses = "text-sm text-rose-glow"
const successClasses = "text-sm text-aquamarine"
const submitClasses = "h-10 w-fit px-5 text-xs"

type DocKey = "resume" | "transcript" | "registration"

const DOC_LABELS: Record<DocKey, string> = {
  resume: "Curriculum Vitae",
  transcript: "Transcript of Records (TOR)",
  registration: "Registration Form",
}

type ApplicantDocumentEditorProps = {
  application: ApplicantApplication
  onUpdated: (application: ApplicantApplication) => void
}

function currentName(
  documents: ApplicantDocument[],
  type: DocumentType
): string | undefined {
  return documents.find((doc) => doc.documentType === type)?.fileName
}

export function ApplicantDocumentEditor({
  application,
  onUpdated,
}: ApplicantDocumentEditorProps) {
  const [resume, setResume] = useState<File | null>(null)
  const [transcript, setTranscript] = useState<File | null>(null)
  const [registration, setRegistration] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pending, setPending] = useState(false)

  const lastName = application.lastName

  function validateFile(type: DocumentType, file: File): boolean {
    return (
      file.type === "application/pdf" &&
      documentFileNameMatches(type, file.name, lastName)
    )
  }

  async function save() {
    setError("")
    setSuccess("")
    const pendingDocs: { documentType: DocumentType; file: File }[] = []
    if (resume) pendingDocs.push({ documentType: "resume", file: resume })
    if (transcript) pendingDocs.push({ documentType: "transcript", file: transcript })
    if (registration) {
      pendingDocs.push({ documentType: "registration", file: registration })
    }

    if (pendingDocs.length === 0) {
      setError("Choose at least one PDF to replace.")
      return
    }

    for (const doc of pendingDocs) {
      if (!validateFile(doc.documentType, doc.file)) {
        setError(
          `Name each replacement PDF exactly: ${documentFileNameFormatExample("resume")}, ${documentFileNameFormatExample("transcript")}, and ${documentFileNameFormatExample("registration")}.`
        )
        return
      }
    }

    setPending(true)
    try {
      const documents = pendingDocs.map((doc) => ({
        documentType: doc.documentType,
        fileName: doc.file.name,
        s3Key: `dev/uploads/${crypto.randomUUID()}/${doc.file.name}`,
      }))
      onUpdated(await updateApplicantDocuments({ documents }))
      setResume(null)
      setTranscript(null)
      setRegistration(null)
      setSuccess("Documents updated.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update documents."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={stackClasses}>
      <h2 className={headingClasses}>Replace documents</h2>
      <p className={hintClasses}>
        Upload only the files you want to change. Names must match{" "}
        {documentFileNameFormatExample("resume")}, etc., using your last name.
      </p>
      <PdfFileDrop
        label={DOC_LABELS.resume}
        hint={fileHint("resume")}
        file={resume}
        displayName={resume ? undefined : currentName(application.documents, "resume")}
        required={false}
        onFile={setResume}
      />
      <PdfFileDrop
        label={DOC_LABELS.transcript}
        hint={fileHint("transcript")}
        file={transcript}
        displayName={
          transcript ? undefined : currentName(application.documents, "transcript")
        }
        required={false}
        onFile={setTranscript}
      />
      <PdfFileDrop
        label={DOC_LABELS.registration}
        hint={fileHint("registration")}
        file={registration}
        displayName={
          registration
            ? undefined
            : currentName(application.documents, "registration")
        }
        required={false}
        onFile={setRegistration}
      />
      {error ? (
        <p className={errorClasses} role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className={successClasses} role="status">
          {success}
        </p>
      ) : null}
      <Button
        type="button"
        color="cyan"
        className={submitClasses}
        disabled={pending}
        onClick={() => void save()}
      >
        {pending ? "Saving…" : "Save documents"}
      </Button>
    </div>
  )
}

function fileHint(documentType: DocumentType) {
  return `Save your PDF as ${documentFileNameFormatExample(documentType)}`
}
