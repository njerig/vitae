import type { CanonItem } from "@/lib/shared/types"

// Snapshot shape (what's actually stored in DB)

export type SnapshotSection = {
  item_type_id: string
  item_ids: string[]
}

export type ResumeSnapshot = {
  sections: SnapshotSection[]
}

// Diff result types

export type FieldChange = {
  field: string
  before: string
  after: string
}

export type ItemDiff = {
  type: "added" | "removed" | "changed" | "unchanged"
  item: CanonItem
  changes?: FieldChange[]
}

export type SectionDiff = {
  display_name: string
  item_type_id: string
  items: ItemDiff[]
  sectionStatus: "added" | "removed" | "changed" | "unchanged"
}

export type ResumeDiff = {
  sections: SectionDiff[]
  hasChanges: boolean
}

/**
 * Compares two resume snapshots and returns a structured diff.
 * Since snapshots only store item IDs, full item content is resolved via allItems.
 *
 * @param snapshotA - The first snapshot to compare
 * @param snapshotB - The second snapshot to compare
 * @param allItems - All canon items for the user, used to resolve IDs to content
 * @param itemTypes - Map of item_type_id -> display_name for section labels
 * @returns A ResumeDiff describing added, removed, changed, and unchanged items per section
 */
export function diffResumes(
  snapshotA: ResumeSnapshot,
  snapshotB: ResumeSnapshot,
  allItems: CanonItem[],
  itemTypes: Record<string, string>
): ResumeDiff {
  const sectionsA = snapshotA?.sections ?? []
  const sectionsB = snapshotB?.sections ?? []

  // Build a lookup map from item ID to full canon item
  const itemMap = new Map(allItems.map((i) => [i.id, i]))

  const sectionMapA = new Map(sectionsA.map((s) => [s.item_type_id, s]))
  const sectionMapB = new Map(sectionsB.map((s) => [s.item_type_id, s]))
  const allTypeIds = new Set([...sectionMapA.keys(), ...sectionMapB.keys()])

  const sectionDiffs: SectionDiff[] = []
  let hasChanges = false

  for (const typeId of allTypeIds) {
    const secA = sectionMapA.get(typeId)
    const secB = sectionMapB.get(typeId)
    const display_name = itemTypes[typeId] ?? "Unknown Section"

    const idsA = secA?.item_ids ?? []
    const idsB = secB?.item_ids ?? []

    // Section only exists in B - all items are new
    if (idsA.length === 0 && idsB.length > 0) {
      hasChanges = true
      sectionDiffs.push({
        display_name,
        item_type_id: typeId,
        sectionStatus: "added",
        items: idsB
          .map((id) => itemMap.get(id))
          .filter(Boolean)
          .map((item) => ({ type: "added" as const, item: item! })),
      })
      continue
    }

    // Section only exists in A - all items were removed
    if (idsA.length > 0 && idsB.length === 0) {
      hasChanges = true
      sectionDiffs.push({
        display_name,
        item_type_id: typeId,
        sectionStatus: "removed",
        items: idsA
          .map((id) => itemMap.get(id))
          .filter(Boolean)
          .map((item) => ({ type: "removed" as const, item: item! })),
      })
      continue
    }

    // Section exists in both - diff items by ID
    const setA = new Set(idsA)
    const setB = new Set(idsB)
    const allIds = new Set([...idsA, ...idsB])
    const itemDiffs: ItemDiff[] = []

    for (const itemId of allIds) {
      const iA = itemMap.get(itemId)
      const inA = setA.has(itemId)
      const inB = setB.has(itemId)

      if (!inA && inB) {
        // Item only in B - added
        const iB = itemMap.get(itemId)
        if (iB) {
          hasChanges = true
          itemDiffs.push({ type: "added", item: iB })
        }
      } else if (inA && !inB) {
        // Item only in A - removed
        if (iA) {
          hasChanges = true
          itemDiffs.push({ type: "removed", item: iA })
        }
      } else if (inA && inB && iA) {
        // Item in both - unchanged (snapshots store IDs only, no content delta)
        itemDiffs.push({ type: "unchanged", item: iA })
      }
    }

    const sectionStatus = itemDiffs.some((d) => d.type !== "unchanged") ? "changed" : "unchanged"
    sectionDiffs.push({ display_name, item_type_id: typeId, sectionStatus, items: itemDiffs })
  }

  return { sections: sectionDiffs, hasChanges }
}
