import { prisma } from "@/lib/prisma";
import { getLocalDateString, formatTodayStr, getTodayRange } from "@/lib/utils";
import { generateTodayMarkdown } from "@/lib/export";
import CopyButton from "@/components/CopyButton";

export const dynamic = "force-dynamic";

export default async function ExportTodayPage() {
  const today = getLocalDateString();
  const { start: todayStart, end: todayEnd } = getTodayRange();

  const [
    workLogs,
    closedItems,
    updatedItems,
    openHighPriorityItems,
    dueTodayItems,
    overdueItems,
    riskAndBlockerLogs,
    decisionLogs,
  ] = await Promise.all([
    prisma.workLog.findMany({
      where: { workDate: today },
      include: { item: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workItem.findMany({
      where: { closedAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { closedAt: "desc" },
    }),
    prisma.workItem.findMany({
      where: { updatedAt: { gte: todayStart, lt: todayEnd } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workItem.findMany({
      where: { priority: { in: ["P0", "P1"] }, status: { not: "closed" } },
      orderBy: { priority: "asc" },
    }),
    prisma.workItem.findMany({
      where: { dueDate: today, status: { not: "closed" } },
      orderBy: { priority: "asc" },
    }),
    prisma.workItem.findMany({
      where: { dueDate: { lt: today }, status: { not: "closed" } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.workLog.findMany({
      where: { workDate: today, type: { in: ["risk", "blocker"] } },
      include: { item: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workLog.findMany({
      where: { workDate: today, type: "decision" },
      include: { item: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const md = generateTodayMarkdown({
    today,
    workLogs,
    closedItems,
    updatedItems,
    openHighPriorityItems,
    dueTodayItems,
    overdueItems,
    riskAndBlockerLogs,
    decisionLogs,
  });

  return (
    <div className="export-page">
      <div className="export-header">
        <div>
          <span className="section-eyebrow">FACT PACKAGE / TODAY</span>
          <h1>今日日报事实包</h1>
          <p>{formatTodayStr()}</p>
        </div>
        <CopyButton text={md} label="复制今日日报事实包" />
      </div>

      <div className="card export-notice">
        <div className="export-notice-icon">i</div>
        <div style={{ minWidth: 0 }}>
          <strong>Work Hub 只导出事实包</strong>
          <p>汇总今天的日志、事项、风险与决策事实，复制 Markdown 后可交给外部工具整理成日报表达。这里新增了质量检查和待确认信息，方便你在复制前先确认事实边界。</p>
          <div style={{ display: "grid", gap: 4, marginTop: 8, color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6 }}>
            <div>质量检查：查看事实规模、覆盖情况、完整性。</div>
            <div>待确认信息：提示缺责任人、下一步、项目/模块等缺口。</div>
            <div>追溯编号：关键事实会带有 LOG-01、P-01 之类编号，便于回查原始事实。</div>
            <div>外部工具只能整理表达，不得补写事实或改写事实边界。</div>
          </div>
        </div>
        <span className="export-ready-tag"><i />可复制事实材料</span>
      </div>

      <div className="card export-preview">
        <div className="export-preview-bar">
          <span><i className="preview-dot red" /><i className="preview-dot amber" /><i className="preview-dot green" /></span>
          <span>daily-facts.md</span>
          <span>MARKDOWN</span>
        </div>
        <pre>{md}</pre>
      </div>
    </div>
  );
}
