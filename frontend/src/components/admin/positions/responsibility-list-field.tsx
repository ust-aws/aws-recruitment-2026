"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ResponsibilityItem } from "@/components/admin/positions/responsibility-items"

type ResponsibilityListFieldProps = {
  items: ResponsibilityItem[]
  onChange: (items: ResponsibilityItem[]) => void
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
  function updateItem(id: string, value: string) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, text: value } : item))
    )
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  function addItem() {
    onChange([...items, { id: crypto.randomUUID(), text: "" }])
  }

  return (
    <div className={fieldClasses}>
      <Label>Responsibilities</Label>
      <div className={listClasses}>
        {items.map((item, index) => (
          <div key={item.id} className={rowClasses}>
            <Input
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder={`Responsibility ${index + 1}`}
              aria-label={`Responsibility ${index + 1}`}
            />
            <Button
              type="button"
              color="purple"
              size="sm"
              className={removeButtonClasses}
              onClick={() => removeItem(item.id)}
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
