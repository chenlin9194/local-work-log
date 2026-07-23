import { describe, expect, it } from "vitest";
import { excludeClosedItemsFromUpdatedItems } from "@/lib/todayBuckets";

describe("today item buckets", () => {
  it("gives same-day closure priority over update while preserving order", () => {
    const closedAt = new Date(2026, 6, 23, 10, 0, 0);
    const updatedItems = [
      { id: "closed-today", updatedAt: new Date(2026, 6, 23, 11, 0, 0) },
      { id: "updated-only", updatedAt: new Date(2026, 6, 23, 12, 0, 0) },
      { id: "closed-another-day", updatedAt: new Date(2026, 6, 22, 12, 0, 0) },
      { title: "missing id", updatedAt: new Date(2026, 6, 23, 13, 0, 0) },
    ];

    const result = excludeClosedItemsFromUpdatedItems(
      [
        { id: "closed-today", closedAt },
        { id: "closed-another-day", closedAt: new Date(2026, 6, 23, 14, 0, 0) },
      ],
      updatedItems,
    );

    expect(result).toEqual([updatedItems[1], updatedItems[2], updatedItems[3]]);
    expect(updatedItems).toHaveLength(4);
  });
});
