export type ResponsibilityItem = {
  id: string
  text: string
}

export function responsibilityItemsFromStrings(
  texts: string[]
): ResponsibilityItem[] {
  if (texts.length === 0) {
    return [{ id: crypto.randomUUID(), text: "" }]
  }

  return texts.map((text) => ({
    id: crypto.randomUUID(),
    text,
  }))
}

export function stringsFromResponsibilityItems(
  items: ResponsibilityItem[]
): string[] {
  return items.flatMap((item) => {
    const trimmed = item.text.trim()
    return trimmed ? [trimmed] : []
  })
}
