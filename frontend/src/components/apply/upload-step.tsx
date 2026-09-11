"use client"



import { PdfFileDrop } from "@/components/apply/pdf-file-drop"

import { documentFileNameFormatExample } from "@/lib/apply-field-validation"

import type { DocumentType } from "@/lib/application-types"



const stackClasses = "flex flex-col gap-5"



export type UploadValues = {

  resume: File | null

  transcript: File | null

  registration: File | null

  resumeDisplayName?: string

  transcriptDisplayName?: string

  registrationDisplayName?: string

}



type UploadStepProps = {

  values: UploadValues

  onChange: (patch: Partial<UploadValues>) => void

}



function fileHint(documentType: DocumentType) {

  return `Save your PDF as ${documentFileNameFormatExample(documentType)}`

}



export function UploadStep({ values, onChange }: UploadStepProps) {

  return (

    <div className={stackClasses}>

      <PdfFileDrop

        label="Curriculum Vitae"

        hint={fileHint("resume")}

        file={values.resume}

        displayName={values.resumeDisplayName}

        onFile={(resume) => onChange({ resume, resumeDisplayName: undefined })}

      />

      <PdfFileDrop

        label="Transcript of Records (TOR)"

        hint={fileHint("transcript")}

        file={values.transcript}

        displayName={values.transcriptDisplayName}

        onFile={(transcript) =>

          onChange({ transcript, transcriptDisplayName: undefined })

        }

      />

      <PdfFileDrop

        label="Registration Form"

        hint={fileHint("registration")}

        file={values.registration}

        displayName={values.registrationDisplayName}

        onFile={(registration) =>

          onChange({ registration, registrationDisplayName: undefined })

        }

      />

    </div>

  )

}


