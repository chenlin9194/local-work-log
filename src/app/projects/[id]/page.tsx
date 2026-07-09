"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageLoadingState from "@/components/PageLoadingState";
import ProjectHeaderSection from "@/components/ProjectHeaderSection";
import ProjectOverviewSection from "@/components/ProjectOverviewSection";
import ProjectSignalSection from "@/components/ProjectSignalSection";
import ProjectMilestoneSection from "@/components/ProjectMilestoneSection";
import ProjectLinkSection from "@/components/ProjectLinkSection";
import ProjectMemberSection from "@/components/ProjectMemberSection";
import { PRIORITY_LABELS, STATUS_LABELS, WORK_LOG_TYPE_LABELS } from "@/lib/constants";
import { signalToItemsHref, signalToLogsHref } from "@/lib/signalMap";
import { getLocalDateString } from "@/lib/utils";
import type { Project, WorkItem, WorkLog } from "@/lib/types";

const KEY_LOG_TYPES = new Set(["risk", "blocker", "decision", "update", "issue"]);

function toTime(value?: Date | string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function isOpenItem(item: WorkItem) {
  return item.status !== "closed";
}

function isItemOverdue(item: WorkItem, today: string) {
  return Boolean(item.dueDate && item.dueDate < today && isOpenItem(item));
}

function getItemEvidenceRank(item: WorkItem, today: string) {
  if (!isOpenItem(item)) return 6;
  if (item.status === "blocked") return 0;
  if (isItemOverdue(item, today)) return 1;
  if (item.priority === "P0" || item.priority === "P1") return 2;
  if (item.health === "red" || item.health === "yellow") return 3;
  return 4;
}

function getItemEvidenceLabel(item: WorkItem, today: string) {
  if (item.status === "blocked") return "阻塞依据";
  if (isItemOverdue(item, today)) return "逾期依据";
  if (item.priority === "P0" || item.priority === "P1") return "高优先级";
  if (item.health === "red" || item.health === "yellow") return "风险关注";
  return undefined;
}

function getLogEvidenceRank(log: WorkLog) {
  if (log.reportable) return 0;
  if (log.type === "risk" || log.type === "blocker") return 1;
  if (log.type === "decision") return 2;
  if (log.type === "update" || log.type === "issue") return 3;
  return 4;
}

function getLogEvidenceLabel(log: WorkLog) {
  if (log.type === "risk" || log.type === "blocker") return "风险/阻塞";
  if (log.type === "decision") return "关键决策";
  if (log.type === "update" || log.type === "issue") return "关键变化";
  return undefined;
}

function isSystemLog(log: WorkLog) {
  return log.type === "update" && (
    log.title.startsWith("事项变化：") ||
    log.title.startsWith("浜嬮」鍙樺寲")
  );
}

function getProjectLogRank(log: WorkLog) {
  const systemRank = isSystemLog(log) ? 1 : 0;
  return systemRank * 10 + getLogEvidenceRank(log);
}

const ATTENTION_CHIP_STYLES = {
  danger: {
    color: "var(--accent-red)",
    background: "color-mix(in srgb, var(--accent-red-light) 70%, var(--bg-secondary))",
    border: "color-mix(in srgb, var(--accent-red) 20%, var(--border-primary))",
  },
  warning: {
    color: "var(--accent-orange)",
    background: "color-mix(in srgb, var(--accent-orange-light) 70%, var(--bg-secondary))",
    border: "color-mix(in srgb, var(--accent-orange) 20%, var(--border-primary))",
  },
  success: {
    color: "var(--accent-green)",
    background: "color-mix(in srgb, var(--accent-green-light) 70%, var(--bg-secondary))",
    border: "color-mix(in srgb, var(--accent-green) 20%, var(--border-primary))",
  },
  neutral: {
    color: "var(--text-secondary)",
    background: "var(--bg-secondary)",
    border: "var(--border-primary)",
  },
} as const;

function getShortDate(value?: Date | string | null) {
  if (!value) return "未设日期";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "未设日期";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function getItemSupportText(item: WorkItem) {
  return item.nextAction || item.currentSummary || item.trackingReason || item.description || "暂无下一步或进展说明";
}

function ProjectItemEvidenceRow({ item, today }: { item: WorkItem; today: string }) {
  const evidenceLabel = getItemEvidenceLabel(item, today);
  const overdue = isItemOverdue(item, today);
  const supportText = getItemSupportText(item);

  return (
    <Link
      href={`/items/${item.id}`}
      className={`project-evidence-row project-evidence-row--item${overdue ? " is-overdue" : ""}${item.status === "blocked" ? " is-blocked" : ""}`}
    >
      <div className="project-evidence-badges">
        {evidenceLabel && <span className="entity-pill entity-pill--warning">{evidenceLabel}</span>}
        <span className={`badge badge-${item.priority.toLowerCase()}`}>{PRIORITY_LABELS[item.priority] || item.priority}</span>
        <span className={`badge badge-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
      </div>
      <div className="project-evidence-title">
        <strong>{item.title}</strong>
        <span>{item.owner || item.module || item.type}</span>
      </div>
      <div className="project-evidence-support">{supportText}</div>
      <div className={`project-evidence-date${overdue ? " is-danger" : ""}`}>{item.dueDate || getShortDate(item.updatedAt)}</div>
      <Icon name="chevron-right" size={14} />
    </Link>
  );
}

function ProjectLogEvidenceRow({ log }: { log: WorkLog }) {
  const evidenceLabel = getLogEvidenceLabel(log);
  const summary = log.content || log.item?.title || "暂无日志正文";

  return (
    <Link href={`/logs/${log.id}`} className={`project-evidence-row project-evidence-row--log${log.reportable ? " is-reportable" : ""}`}>
      <div className="project-evidence-badges">
        {evidenceLabel && <span className="entity-pill entity-pill--warning">{evidenceLabel}</span>}
        {log.reportable && <span className="entity-pill entity-pill--success">可汇报</span>}
        <span className="entity-pill entity-pill--muted">{WORK_LOG_TYPE_LABELS[log.type] || log.type}</span>
      </div>
      <div className="project-evidence-title">
        <strong>{log.title}</strong>
        <span>{log.item?.title ? `关联事项：${log.item.title}` : log.module || log.source}</span>
      </div>
      <div className="project-evidence-support">{summary}</div>
      <div className="project-evidence-date">{log.workDate}</div>
      <Icon name="chevron-right" size={14} />
    </Link>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClosedItems, setShowClosedItems] = useState(false);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showClosedItemLogs, setShowClosedItemLogs] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="page-shell">
        <PageLoadingState
          title="加载项目详情..."
          description="正在读取项目主体、风险信号和相关记录。"
          rows={5}
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-shell">
        <div className="card empty-state">
          <div className="empty-icon">
            <Icon name="folder" size={28} />
          </div>
          <p>项目不存在</p>
          <Link href="/projects" className="btn btn-secondary">
            返回项目列表
          </Link>
        </div>
      </div>
    );
  }

  const items = project.items || [];
  const openItems = items.filter((item) => item.status !== "closed");
  const closedItems = items.filter((item) => item.status === "closed");
  const closedItemIds = new Set(closedItems.map((item) => item.id));
  const logs = project.logs || [];
  const p0p1Count = openItems.filter((i) => i.priority === "P0" || i.priority === "P1").length;
  const blockedCount = openItems.filter((i) => i.status === "blocked").length;
  const redYellowCount = openItems.filter((i) => i.health === "red" || i.health === "yellow").length;
  const today = getLocalDateString();
  const overdueCount = openItems.filter((i) => i.dueDate && i.dueDate < today).length;
  const attentionItems = openItems.filter((item) => getItemEvidenceRank(item, today) <= 3);
  const sortedItems = [...openItems].sort((a, b) => {
    const rankDiff = getItemEvidenceRank(a, today) - getItemEvidenceRank(b, today);
    if (rankDiff !== 0) return rankDiff;

    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return toTime(b.updatedAt) - toTime(a.updatedAt);
  });
  const sortedClosedItems = [...closedItems].sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));
  const visibleProjectItems = showClosedItems ? [...sortedItems, ...sortedClosedItems] : sortedItems;
  const keyLogCount = logs.filter((log) => KEY_LOG_TYPES.has(log.type)).length;
  const riskLogCount = logs.filter((log) => log.type === "risk").length;
  const reportableLogCount = logs.filter((log) => log.reportable).length;
  const systemLogCount = logs.filter(isSystemLog).length;
  const closedItemLogCount = logs.filter((log) => log.itemId && closedItemIds.has(log.itemId)).length;
  const sortedLogs = [...logs].sort((a, b) => {
    const rankDiff = getProjectLogRank(a) - getProjectLogRank(b);
    if (rankDiff !== 0) return rankDiff;

    const workDateDiff = b.workDate.localeCompare(a.workDate);
    if (workDateDiff !== 0) return workDateDiff;

    return toTime(b.createdAt) - toTime(a.createdAt);
  });
  const visibleProjectLogs = sortedLogs.filter((log) => {
    if (!showSystemLogs && isSystemLog(log)) return false;
    if (!showClosedItemLogs && log.itemId && closedItemIds.has(log.itemId) && isSystemLog(log) && !log.reportable) return false;
    return true;
  });

  return (
    <div className="page-shell cockpit-page detail-page project-detail-page">
      <div id="project-overview" style={{ scrollMarginTop: 12 }}>
        <ProjectHeaderSection project={project} />
        <ProjectOverviewSection project={project} />
      </div>
      <div id="project-signals" style={{ scrollMarginTop: 12 }}>
        <ProjectSignalSection
          projectId={project.id}
          items={openItems}
          logs={logs}
          today={today}
          itemCount={project._count?.items || 0}
          logCount={project._count?.logs || 0}
          p0p1Count={p0p1Count}
          blockedCount={blockedCount}
          redYellowCount={redYellowCount}
          overdueCount={overdueCount}
        />
      </div>

      <section className="cockpit-section project-quick-actions-section">
        <div className="card project-support-summary project-support-summary--compact">
          <div className="project-support-summary__title">
            <div className="project-support-summary__headline">补充事实记录</div>
            <div className="project-support-summary__hint">新增关联事项或日志，让项目状态由事实对象持续支撑。</div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={`/items/new?projectId=${project.id}`} className="btn btn-primary">
              <Icon name="plus" size={15} />
              新建关联事项
            </Link>
            <Link href={`/logs/new?projectId=${project.id}`} className="btn btn-secondary">
              <Icon name="edit" size={15} />
              新建关联日志
            </Link>
          </div>
        </div>
      </section>

      <div id="project-milestones" style={{ scrollMarginTop: 12 }}>
        <ProjectMilestoneSection projectId={project.id} />
      </div>
      <div id="project-members" style={{ scrollMarginTop: 12 }}>
        <ProjectMemberSection projectId={project.id} />
      </div>
      <div id="project-resources" style={{ scrollMarginTop: 12 }}>
        <ProjectLinkSection projectId={project.id} />
        <div className="card project-resource-source">
          <span className="section-eyebrow">REFERENCE</span>
          <div>
            {project.sourceSystem && <span>来源：{project.sourceSystem}</span>}
            {project.sourceId && <span>编号：{project.sourceId}</span>}
            {project.sourceUrl && (
              <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
                打开来源链接 <Icon name="external-link" size={12} />
              </a>
            )}
            {!project.sourceSystem && !project.sourceId && !project.sourceUrl && <span>暂无来源资料</span>}
          </div>
        </div>
      </div>

      <section className="cockpit-section" id="project-items" style={{ scrollMarginTop: 12 }}>
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">ITEMS</span>
            <h2>关联事项</h2>
          </div>
          <Link href={signalToItemsHref("projectItems", project.id)} className="section-link">
            查看全部 <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        {items.length === 0 ? (
          <div className="card empty-state project-compact-empty">
            <p>暂无关联事项，可新增事项作为项目状态支撑。</p>
            <div className="empty-actions">
              <Link href={`/items/new?projectId=${project.id}`} className="btn btn-secondary">
                <Icon name="plus" size={14} />
                新建关联事项
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div
              className="card"
              style={{
                padding: 14,
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                border: attentionItems.length > 0
                  ? "1px solid color-mix(in srgb, var(--accent-orange) 28%, var(--border-primary))"
                  : "1px solid var(--border-primary)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 650, color: "var(--text-primary)", marginBottom: 4 }}>
                  重点事项 {attentionItems.length} 项
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  这些事项用于解释项目阻塞、风险、逾期和高优先级状态。
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Link
                  href={signalToItemsHref("blocked", project.id)}
                  style={{ display: "inline-flex", alignItems: "center", fontSize: 12, padding: "2px 8px", borderRadius: 999, background: ATTENTION_CHIP_STYLES.danger.background, color: ATTENTION_CHIP_STYLES.danger.color, border: `1px solid ${ATTENTION_CHIP_STYLES.danger.border}`, textDecoration: "none" }}
                >
                  阻塞 {blockedCount}
                </Link>
                <Link
                  href={signalToItemsHref("p0p1", project.id)}
                  style={{ display: "inline-flex", alignItems: "center", fontSize: 12, padding: "2px 8px", borderRadius: 999, background: ATTENTION_CHIP_STYLES.warning.background, color: ATTENTION_CHIP_STYLES.warning.color, border: `1px solid ${ATTENTION_CHIP_STYLES.warning.border}`, textDecoration: "none" }}
                >
                  P0/P1 {p0p1Count}
                </Link>
                <Link
                  href={signalToItemsHref("overdue", project.id)}
                  style={{ display: "inline-flex", alignItems: "center", fontSize: 12, padding: "2px 8px", borderRadius: 999, background: ATTENTION_CHIP_STYLES.danger.background, color: ATTENTION_CHIP_STYLES.danger.color, border: `1px solid ${ATTENTION_CHIP_STYLES.danger.border}`, textDecoration: "none" }}
                >
                  逾期 {overdueCount}
                </Link>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>红黄 {redYellowCount}</span>
              </div>
            </div>
            {closedItems.length > 0 && (
              <div className="project-section-controls">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClosedItems((value) => !value)}
                >
                  {showClosedItems ? "隐藏已关闭" : "显示已关闭"}（{closedItems.length}）
                </button>
              </div>
            )}
            <div className="project-evidence-list">
              {visibleProjectItems.slice(0, 20).map((item) => (
                <ProjectItemEvidenceRow key={item.id} item={item} today={today} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="cockpit-section" id="project-logs" style={{ scrollMarginTop: 12 }}>
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">LOGS</span>
            <h2>最近日志</h2>
          </div>
          <Link href={signalToLogsHref("projectLogs", project.id)} className="section-link">
            查看全部 <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        {logs.length === 0 ? (
          <div className="card empty-state project-compact-empty">
            <p>暂无关联日志，可补充事实记录支撑项目判断。</p>
            <div className="empty-actions">
              <Link href={`/logs/new?projectId=${project.id}`} className="btn btn-secondary">
                <Icon name="edit" size={14} />
                新建关联日志
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div
              className="card"
              style={{
                padding: 14,
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 650, color: "var(--text-primary)", marginBottom: 4 }}>
                  关键变化 {keyLogCount} 条
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  最近日志用于支撑当前摘要、风险判断和项目汇报事实。
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Link href={signalToLogsHref("risk", project.id)} style={{ display: "inline-flex", alignItems: "center", fontSize: 12, padding: "2px 8px", borderRadius: 999, background: ATTENTION_CHIP_STYLES.danger.background, color: ATTENTION_CHIP_STYLES.danger.color, border: `1px solid ${ATTENTION_CHIP_STYLES.danger.border}`, textDecoration: "none" }}>
                  风险 {riskLogCount}
                </Link>
                <Link
                  href={signalToLogsHref("reportable", project.id)}
                  style={{ display: "inline-flex", alignItems: "center", fontSize: 12, padding: "2px 8px", borderRadius: 999, background: ATTENTION_CHIP_STYLES.success.background, color: ATTENTION_CHIP_STYLES.success.color, border: `1px solid ${ATTENTION_CHIP_STYLES.success.border}`, textDecoration: "none" }}
                >
                  可汇报 {reportableLogCount}
                </Link>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>最近 {logs.length}</span>
              </div>
            </div>
            <div className="project-section-controls">
              {systemLogCount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSystemLogs((value) => !value)}
                >
                  {showSystemLogs ? "隐藏系统动态" : "显示系统动态"}（{systemLogCount}）
                </button>
              )}
              {closedItemLogCount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowClosedItemLogs((value) => !value)}
                >
                  {showClosedItemLogs ? "收起已关闭事项日志" : "显示已关闭事项日志"}（{closedItemLogCount}）
                </button>
              )}
            </div>
            <div className="project-evidence-list">
              {visibleProjectLogs.slice(0, 20).map((log) => (
                <ProjectLogEvidenceRow key={log.id} log={log} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
