"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ResponsibilityListFieldProps = {
  items: string[]
  onChange: (items: string[]) => void
}

const fieldClasses = "flex flex-col gap-2"
const listClasses = "flex flex-col gap-2"
const rowClasses = "flex items-center gap-2"
const removeButtonClasses =
  "shrink-0 border-blue-chalk/20 bg-transparent text-prelude hover:bg-haiti/50 hover:text-blue-chalk"

export function ResponsibilityListField({
  items,
  onChange,
}: ResponsibilityListFieldProps) {
  function updateItem(index: number, value: string) {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, ""])
  }

  return (
    <div className={fieldClasses}>
      <Label>Responsibilities</Label>
      <div className={listClasses}>
        {items.map((item, index) => (
          <div key={index} className={rowClasses}>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`Responsibility ${index + 1}`}
              aria-label={`Responsibility ${index + 1}`}
            />
            <Button
              type="button"
              color="purple"
              size="sm"
              className={removeButtonClasses}
              onClick={() => removeItem(index)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" color="purple" size="sm" onClick={addItem}>
        Add bullet
      </Button>
    </div>
  )
}
