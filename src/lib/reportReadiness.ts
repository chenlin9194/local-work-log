export const REPORT_QUALITY_VALUES = [
  "missing_owner",
  "missing_next_action",
  "missing_project",
  "p0p1_without_today_log",
  "blocked_without_risk_log",
] as const;

export type ReportQuality = (typeof REPORT_QUALITY_VALUES)[number];

export const REPORT_QUALITY_LABELS: Record<ReportQuality, string> = {
  missing_owner: "缺少责任人",
  missing_next_action: "缺少下一步",
  missing_project: "缺少项目归属",
  p0p1_without_today_log: "P0/P1 当日无日志",
  blocked_without_risk_log: "阻塞缺少风险说明",
};

export type ReportReadinessItem = {
  id: string;
  title: string;
  owner?: string | null;
  nextAction?: string | null;
  projectId?: string | null;
  project?: string | null;
  priority: string;
  status: string;
  health: string;
  dueDate?: string | null;
  logs: Array<{ workDate: string; type: string }>;
};

export function isReportQuality(value: string | null | undefined): value is ReportQuality {
  return Boolean(value && REPORT_QUALITY_VALUES.includes(value as ReportQuality));
}

export function isAttentionItem(item: Omit<ReportReadinessItem, "logs">, today: string) {
  return item.status !== "closed" && (
    item.priority === "P0" ||
    item.priority === "P1" ||
    item.status === "blocked" ||
    item.health === "red" ||
    Boolean(item.dueDate && item.dueDate <= today)
  );
}

export function getReportQualityItems(items: ReportReadinessItem[], today: string): Record<ReportQuality, ReportReadinessItem[]> {
  const attentionItems = items.filter((item) => isAttentionItem(item, today));

  return {
    missing_owner: attentionItems.filter((item) => !item.owner?.trim()),
    missing_next_action: attentionItems.filter((item) => !item.nextAction?.trim()),
    missing_project: attentionItems.filter((item) => !item.projectId && !item.project?.trim()),
    p0p1_without_today_log: items.filter(
      (item) => item.status !== "closed" && (item.priority === "P0" || item.priority === "P1") && !item.logs.some((log) => log.workDate === today)
    ),
    blocked_without_risk_log: items.filter(
      (item) => item.status === "blocked" && !item.logs.some((log) => log.type === "risk" || log.type === "blocker")
    ),
  };
}

export function buildReportQualityWhere(quality: ReportQuality, today: string): Record<string, unknown> {
  const attentionWhere = {
    status: { not: "closed" },
    OR: [
      { priority: { in: ["P0", "P1"] } },
      { status: "blocked" },
      { health: "red" },
      { dueDate: { lte: today } },
    ],
  };

  switch (quality) {
    case "missing_owner":
      return { AND: [attentionWhere, { OR: [{ owner: null }, { owner: "" }] }] };
    case "missing_next_action":
      return { AND: [attentionWhere, { OR: [{ nextAction: null }, { nextAction: "" }] }] };
    case "missing_project":
      return { AND: [attentionWhere, { projectId: null }, { OR: [{ project: null }, { project: "" }] }] };
    case "p0p1_without_today_log":
      return {
        AND: [
          { status: { not: "closed" } },
          { priority: { in: ["P0", "P1"] } },
          { logs: { none: { workDate: today } } },
        ],
      };
    case "blocked_without_risk_log":
      return { AND: [{ status: "blocked" }, { logs: { none: { type: { in: ["risk", "blocker"] } } } }] };
  }
}
