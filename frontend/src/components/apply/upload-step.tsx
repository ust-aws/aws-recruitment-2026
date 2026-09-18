"use client"



import { PdfFileDrop } from "@/components/apply/pdf-file-drop"

import { documentUploadFileHint } from "@/lib/apply/field-validation"

import type { DocumentType } from "@/lib/types/application"
import type { UploadValues } from "@/components/apply/apply-schema"



const stackClasses = "flex flex-col gap-5"



type UploadStepProps = {

  values: UploadValues

  onChange: (patch: Partial<UploadValues>) => void

  errors?: Partial<Record<keyof UploadValues, string>>

}



function fileHint(documentType: DocumentType) {
  return documentUploadFileHint(documentType)
}



export function UploadStep({ values, onChange, errors }: UploadStepProps) {

  return (

    <div className={stackClasses}>

      <PdfFileDrop

        label="Curriculum Vitae"

        hint={fileHint("resume")}

        file={values.resume}

        displayName={values.resumeDisplayName}

        error={errors?.resume}

        onFile={(resume) =>
          onChange({ resume, resumeDisplayName: resume?.name })
        }

      />

      <PdfFileDrop

        label="Registration Form"

        hint={fileHint("registration")}

        file={values.registration}

        displayName={values.registrationDisplayName}

        error={errors?.registration}

        onFile={(registration) =>

          onChange({ registration, registrationDisplayName: registration?.name })

        }

      />

    </div>

  )

}

