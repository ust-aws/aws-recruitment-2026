"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STACK_LAYERS = [
  { id: "compute", label: "COMPUTE", options: ["Virtual Server", "Serverless Function", "Container"] },
  { id: "storage", label: "STORAGE", options: ["Object Storage", "Block Storage"] },
  { id: "database", label: "DATABASE", options: ["Relational DB", "NoSQL DB"] },
  { id: "ai", label: "AI/ML", options: ["Foundation Model API", "Custom Model Training"] },
  { id: "networking", label: "NETWORKING & SECURITY", options: ["Load Balancer", "Identity & Access"] },
] as const

type LayerId = (typeof STACK_LAYERS)[number]["id"]
type StackSelections = Partial<Record<LayerId, string>>
const LOG_LAYER_IDS: LayerId[] = ["storage", "database", "compute", "ai", "networking"]
const TOTAL_LAYERS = STACK_LAYERS.length

const sectionClasses = "flex flex-col gap-8 pt-[clamp(3rem,7vw,5.625rem)] md:gap-10"
const eyebrowClasses = "font-mono text-xs font-medium uppercase tracking-wide text-aquamarine"
const titleClasses = "max-w-[720px] text-5xl font-bold leading-[1.02] text-blue-chalk sm:text-6xl lg:text-[3.75rem]"
const descriptionClasses = "max-w-[680px] text-base leading-relaxed text-prelude"
const panelClasses = "grid overflow-hidden rounded-[28px] border border-biloba-flower/25 bg-meteorite/45 shadow-[0_0_36px_rgba(23,15,51,0.28)] lg:grid-cols-2"
const builderClasses = "flex flex-col gap-5 bg-daisy-bush/35 p-5 sm:p-7"
const layerClasses = "flex flex-col gap-2.5"
const labelClasses = "font-mono text-[0.68rem] font-medium tracking-[0.12em] text-aquamarine"
const optionListClasses = "flex flex-wrap gap-2"
const optionClasses = "rounded-pill border px-3 py-2 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aquamarine sm:px-3.5"
const selectedOptionClasses = "border-aquamarine bg-aquamarine text-haiti"
const inactiveOptionClasses = "border-biloba-flower/30 bg-haiti/35 text-prelude hover:border-biloba-flower/65 hover:bg-haiti/55"
const terminalClasses = "flex min-h-[28rem] flex-col bg-haiti/90 p-5 sm:p-7"
const terminalHeaderClasses = "flex items-center justify-between border-b border-biloba-flower/20 pb-4 font-mono text-xs"
const logTitleClasses = "text-blue-chalk"
const layerCountClasses = "text-aquamarine"
const logsClasses = "flex flex-1 flex-col justify-center gap-3 py-7 font-mono text-xs leading-relaxed text-prelude sm:text-sm"
const commandClasses = "text-aquamarine"
const deploymentClasses = "rounded-[14px] border border-biloba-flower/30 bg-meteorite/30 p-4 text-sm leading-relaxed text-blue-chalk"
const actionsClasses = "mt-4 flex flex-wrap items-center gap-4"
const resetClasses = "w-fit font-mono text-xs text-prelude underline decoration-biloba-flower/60 underline-offset-4 transition-colors hover:text-aquamarine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-aquamarine"

export function StackSection() {
  const [selections, setSelections] = useState<StackSelections>({})
  const [isDeployed, setIsDeployed] = useState(false)
  const selectedLayerCount = Object.keys(selections).length
  const isComplete = selectedLayerCount === TOTAL_LAYERS

  function selectOption(layer: LayerId, option: string) {
    setSelections((current) => ({ ...current, [layer]: option }))
    setIsDeployed(false)
  }

  function resetStack() {
    setSelections({})
    setIsDeployed(false)
  }

  function deployStack() {
    if (isComplete) {
      setIsDeployed(true)
    }
  }

  return (
    <section id="build-stack" aria-labelledby="build-stack-title" className={sectionClasses}>
      <div className="flex flex-col gap-3">
        <p className={eyebrowClasses}>{"// BUILD YOUR FIRST STACK"}</p>
        <h2 id="build-stack-title" className={titleClasses}>
          Click your way to your <br className="hidden sm:block" />first cloud stack.
        </h2>
        <p className={descriptionClasses}>
          This is basically what your first workshop feels like — pick a layer from each category and watch your stack come together.
        </p>
      </div>

      <div className={panelClasses}>
        <div className={builderClasses}>
          {STACK_LAYERS.map((layer) => (
            <fieldset key={layer.id} className={layerClasses}>
              <legend className={labelClasses}>{layer.label}</legend>
              <div className={optionListClasses}>
                {layer.options.map((option) => {
                  const selected = selections[layer.id] === option

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selected}
                      className={cn(optionClasses, selected ? selectedOptionClasses : inactiveOptionClasses)}
                      onClick={() => selectOption(layer.id, option)}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className={terminalClasses}>
          <div className={terminalHeaderClasses}>
            <span className={logTitleClasses}>stack.log</span>
            <span className={layerCountClasses}>
              {selectedLayerCount}/{TOTAL_LAYERS} layers
            </span>
          </div>
          <div className={logsClasses} aria-live="polite">
            {LOG_LAYER_IDS.map((layer) => {
              const selection = selections[layer]

              return (
                <p key={layer}>
                  <span className={commandClasses}>$ layer:{layer} ➜ </span>
                  {selection ? `${selection} ready` : "awaiting selection"}
                </p>
              )
            })}
          </div>
          {isDeployed && (
            <p className={deploymentClasses}>
              Stack deployed. That&apos;s the exact loop we run in real build sessions — just with real AWS consoles instead of buttons on a webpage.
            </p>
          )}
          <div className={actionsClasses}>
            <Button type="button" color="cyan" onClick={deployStack} disabled={!isComplete}>
              deploy stack
            </Button>
            <button type="button" className={resetClasses} onClick={resetStack}>
              reset stack
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
