import { getLocalDateString } from "@/lib/utils";

export interface DatedWorkItem {
  id?: string | null;
  closedAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * A work item closed on the same local day belongs to the closed bucket only.
 * Items without an id are retained because they cannot be safely matched.
 * If timeline data is incomplete, exclude the matching updated item
 * conservatively rather than report a possible duplicate.
 */
export function excludeClosedItemsFromUpdatedItems<T extends DatedWorkItem>(
  closedItems: readonly DatedWorkItem[],
  updatedItems: readonly T[],
): T[] {
  const closedDatesById = new Map<string, string | null>();

  for (const item of closedItems) {
    if (!item.id) continue;
    closedDatesById.set(item.id, item.closedAt ? getLocalDateString(item.closedAt) : null);
  }

  return updatedItems.filter((item) => {
    if (!item.id || !closedDatesById.has(item.id)) return true;

    const closedDate = closedDatesById.get(item.id);
    if (!closedDate || !item.updatedAt) return false;

    return closedDate !== getLocalDateString(item.updatedAt);
  });
}
