"use client";

import Link from "next/link";
import {
  PROJECT_MILESTONE_STATUS_LABELS,
  PROJECT_PLAN_TYPE_LABELS,
} from "@/lib/constants";
import type { Project, ProjectMilestone, WorkItem } from "@/lib/types";

type ProjectOverviewSectionProps = {
  project: Project;
};

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatDate(value?: string | Date | null) {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("zh-CN");
}

function getMilestoneDate(milestone?: ProjectMilestone | null) {
  if (!milestone) return null;
  return milestone.targetDate || milestone.plannedEndDate || milestone.plannedStartDate || null;
}

function getDaySignal(value?: string | Date | null) {
  const date = toDate(value);
  if (!date) return "日期待定";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return `已延期 ${Math.abs(diff)} 天`;
  if (diff === 0) return "今天到期";
  return `剩余 ${diff} 天`;
}

function getNextMilestone(milestones?: ProjectMilestone[]) {
  const openMilestones = (milestones || []).filter((milestone) => (
    milestone.status !== "done" && milestone.status !== "cancelled"
  ));

  return openMilestones.sort((a, b) => {
    const aTime = toDate(getMilestoneDate(a))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bTime = toDate(getMilestoneDate(b))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (aTime !== bTime) return aTime - bTime;
    return a.sortOrder - b.sortOrder;
  })[0] || null;
}

function isOpenItem(item: WorkItem) {
  return item.status !== "closed";
}

function isOverdue(item: WorkItem) {
  if (!item.dueDate || !isOpenItem(item)) return false;
  const dueDate = toDate(item.dueDate);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function MetaItem({ label, value }: { label: string; value?: string | Date | null }) {
  if (!value) return null;

  const formattedValue = value instanceof Date || (typeof value === "string" && /^\d{4}-/.test(value))
    ? formatDate(value)
    : value;

  return (
    <div className="project-overview-meta-item">
      <span>{label}</span>
      <strong>{formattedValue}</strong>
    </div>
  );
}

function getUrlHost(value?: string | null) {
  if (!value) return "";
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

export default function ProjectOverviewSection({ project }: ProjectOverviewSectionProps) {
  const items = project.items || [];
  const openItems = items.filter(isOpenItem);
  const logs = project.logs || [];
  const nextMilestone = getNextMilestone(project.milestones);
  const fallbackMilestone = project.nextMilestone?.trim();
  const milestoneTitle = nextMilestone?.title || fallbackMilestone || "未设置下一个关键节点";
  const milestoneDate = getMilestoneDate(nextMilestone) || project.targetDate;
  const p0p1Count = openItems.filter((item) => item.priority === "P0" || item.priority === "P1").length;
  const blockedCount = openItems.filter((item) => item.status === "blocked").length;
  const redYellowCount = openItems.filter((item) => item.health === "red" || item.health === "yellow").length;
  const overdueCount = openItems.filter(isOverdue).length;
  const recentLogCount = logs.slice(0, 5).length;
  const projectDescription = project.description || project.currentSummary || "";
  const hasMetaInfo = Boolean(project.owner || project.pm || project.startDate || project.targetDate || project.releaseDate || project.tags);
  const hasNextMilestone = Boolean(nextMilestone || fallbackMilestone || project.targetDate);

  return (
    <section className="cockpit-section">
      <div className="dashboard-section-title">
        <div>
          <span className="section-eyebrow">PROJECT COCKPIT</span>
          <h2>项目概览</h2>
        </div>
      </div>

      <div className="card project-overview-card project-cockpit-overview">
        <div className="project-overview-grid">
          <section className="project-overview-panel project-overview-panel--description">
            <span className="project-overview-panel-label">项目说明 / 版本定位</span>
            {projectDescription.trim() ? (
              <p>{projectDescription}</p>
            ) : (
              <p className="project-overview-empty">暂无项目说明，可在编辑页补充稳定背景、版本定位或备注。</p>
            )}
            {project.nextAction?.trim() && (
              <div className="project-overview-supplement">
                <span>补充推进说明</span>
                <strong>{project.nextAction}</strong>
              </div>
            )}
            {project.sourceUrl && (
              <div className="project-source-reference-inline">
                <span>来源参考：</span>
                <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer" title={project.sourceUrl || undefined}>
                  {getUrlHost(project.sourceUrl)} ↗
                </a>
              </div>
            )}
          </section>

          <Link href="#project-milestones" className={`project-overview-panel project-overview-panel--next${hasNextMilestone ? "" : " is-empty"}`}>
            <span className="project-overview-panel-label">下一个关键节点</span>
            <strong>{milestoneTitle}</strong>
            {hasNextMilestone ? (
              <div className="project-overview-next-meta">
                <span>{formatDate(milestoneDate)}</span>
                <span>{getDaySignal(milestoneDate)}</span>
                <span>
                  {nextMilestone
                    ? PROJECT_PLAN_TYPE_LABELS[nextMilestone.planType] || "节点"
                    : "项目级锚点"}
                </span>
              </div>
            ) : (
              <div className="project-overview-next-meta project-overview-next-meta--empty">
                <span>可在项目计划中补充里程碑或下一步关注。</span>
              </div>
            )}
            {nextMilestone && (
              <span className="project-overview-next-status">
                {PROJECT_MILESTONE_STATUS_LABELS[nextMilestone.status] || nextMilestone.status}
              </span>
            )}
          </Link>

          <section className="project-overview-panel project-overview-panel--signals">
            <span className="project-overview-panel-label">当前态势</span>
            <div className="project-overview-signal-grid">
              <span className={p0p1Count > 0 ? "is-warn" : ""}><strong>{p0p1Count}</strong>P0/P1</span>
              <span className={blockedCount > 0 ? "is-danger" : ""}><strong>{blockedCount}</strong>阻塞</span>
              <span className={overdueCount > 0 ? "is-danger" : ""}><strong>{overdueCount}</strong>逾期</span>
              <span className={redYellowCount > 0 ? "is-warn" : ""}><strong>{redYellowCount}</strong>红黄</span>
              <span><strong>{openItems.length}</strong>待处理</span>
              <span><strong>{recentLogCount}</strong>最近日志</span>
            </div>
          </section>
        </div>

        {hasMetaInfo ? (
          <div className="project-overview-meta-rail">
            <MetaItem label="负责人" value={project.owner} />
            <MetaItem label="PM" value={project.pm} />
            <MetaItem label="开始" value={project.startDate} />
            <MetaItem label="目标" value={project.targetDate} />
            <MetaItem label="发布" value={project.releaseDate} />
            {project.tags && (
              <div className="project-overview-meta-item project-overview-meta-item--wide">
                <span>标签</span>
                <strong>{project.tags}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="project-overview-meta-empty">基础信息待补充</div>
        )}
      </div>
    </section>
  );
}
