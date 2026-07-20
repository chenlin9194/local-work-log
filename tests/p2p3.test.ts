import { describe, expect, it } from "vitest";
import { resolveActionItemDoneNote, validateActionItemCompletion } from "@/lib/actionItemCompletion";
import { groupOpenActionItems } from "@/lib/actionItemQueue";
import { buildItemsQueryString } from "@/lib/filterLinks";
import { getReportQualityItems } from "@/lib/reportReadiness";

describe("P2 action execution rules", () => {
  it("requires a conclusion only when an action item becomes done", () => {
    expect(resolveActionItemDoneNote("done", "   ").error).toBeDefined();
    expect(resolveActionItemDoneNote("done", " 已同步负责人 ").value).toBe("已同步负责人");
    expect(validateActionItemCompletion("pending", "done", "").error).toBeDefined();
    expect(validateActionItemCompletion("done", "done", undefined).error).toBeUndefined();
  });

  it("groups open actions into overdue, due today and other work", () => {
    const groups = groupOpenActionItems([
      { status: "pending", dueDate: "2026-07-19" },
      { status: "in_progress", dueDate: "2026-07-20" },
      { status: "pending", dueDate: "2026-07-22" },
      { status: "done", dueDate: "2026-07-18" },
      { status: "pending", dueDate: null },
    ], "2026-07-20");

    expect(groups.overdue).toHaveLength(1);
    expect(groups.dueToday).toHaveLength(1);
    expect(groups.other).toHaveLength(2);
  });
});

describe("P3 report readiness", () => {
  it("classifies every quality gap and creates a quality filter link", () => {
    const items = [
      { id: "owner", title: "缺少责任人", owner: null, nextAction: "同步", projectId: "p1", project: "项目", priority: "P0", status: "open", health: "green", dueDate: null, logs: [{ workDate: "2026-07-20", type: "note" }] },
      { id: "next", title: "缺少下一步", owner: "王工", nextAction: null, projectId: "p1", project: "项目", priority: "P1", status: "open", health: "green", dueDate: null, logs: [{ workDate: "2026-07-20", type: "note" }] },
      { id: "project", title: "缺少项目", owner: "王工", nextAction: "推进", projectId: null, project: null, priority: "P2", status: "open", health: "red", dueDate: null, logs: [{ workDate: "2026-07-20", type: "note" }] },
      { id: "unlogged", title: "无当日日志", owner: "王工", nextAction: "推进", projectId: "p1", project: "项目", priority: "P0", status: "open", health: "green", dueDate: null, logs: [{ workDate: "2026-07-19", type: "note" }] },
      { id: "blocked", title: "阻塞无说明", owner: "王工", nextAction: "推进", projectId: "p1", project: "项目", priority: "P2", status: "blocked", health: "yellow", dueDate: null, logs: [{ workDate: "2026-07-20", type: "note" }] },
    ];

    const quality = getReportQualityItems(items, "2026-07-20");
    expect(quality.missing_owner.map((item) => item.id)).toContain("owner");
    expect(quality.missing_next_action.map((item) => item.id)).toContain("next");
    expect(quality.missing_project.map((item) => item.id)).toContain("project");
    expect(quality.p0p1_without_today_log.map((item) => item.id)).toContain("unlogged");
    expect(quality.blocked_without_risk_log.map((item) => item.id)).toContain("blocked");
    expect(buildItemsQueryString({ quality: "missing_owner" })).toBe("quality=missing_owner");
  });
});
