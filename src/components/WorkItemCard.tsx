"use client";

import Link from "next/link";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  WORK_ITEM_TYPE_LABELS,
} from "@/lib/constants";
import { isOverdue, splitCommaSeparatedText } from "@/lib/utils";
import Icon from "./Icon";

interface WorkItemCardProps {
  item: {
    id: string;
    title: string;
    description?: string | null;
    project?: string | null;
    module?: string | null;
    type: string;
    priority: string;
    status: string;
    owner?: string | null;
    dueDate?: string | null;
    nextAction?: string | null;
    trackingReason?: string | null;
    sourceSystem?: string | null;
    sourceId?: string | null;
    sourceUrl?: string | null;
    health?: string | null;
    currentSummary?: string | null;
    nextCheckpoint?: string | null;
    reportLevel?: string | null;
    tags?: string | null;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date | null;
  };
  evidenceLabel?: string;
  lowActivity?: boolean;
}

export default function WorkItemCard({ item, evidenceLabel, lowActivity = false }: WorkItemCardProps) {
  const overdue = isOverdue(item.dueDate, item.status);
  const blocked = item.status === "blocked";
  const closed = item.status === "closed";
  const summary = item.description || item.trackingReason || item.currentSummary || "暂无事项说明";
  const tags = splitCommaSeparatedText(item.tags);
  const visibleTags = tags.slice(0, 2);
  const hiddenTagCount = Math.max(tags.length - visibleTags.length, 0);

  return (
    <Link
      href={`/items/${item.id}`}
      className={`card card-hover entity-card work-item-card priority-${item.priority.toLowerCase()}${blocked ? " is-blocked" : ""}${closed ? " is-closed" : ""}${overdue ? " is-overdue" : ""}${lowActivity ? " is-low-activity" : ""}`}
    >
      <div className="work-item-card-layer work-item-card-identity">
        <div className="work-item-card-title-group">
          <div className="entity-card-badges work-card-badges">
            {evidenceLabel && (
              <span className="entity-pill entity-pill--warning">
                {evidenceLabel}
              </span>
            )}
            {lowActivity && (
              <span className="entity-pill entity-pill--muted">
                低活跃
              </span>
            )}
            <span className={`badge badge-${item.priority.toLowerCase()}`}>
              {PRIORITY_LABELS[item.priority] || item.priority}
            </span>
            <span className={`badge badge-${item.status}`}>
              {blocked && <Icon name="alert-triangle" size={11} />}
              {STATUS_LABELS[item.status] || item.status}
            </span>
            {overdue && (
              <span className="badge badge-overdue">
                <Icon name="clock" size={11} />逾期
              </span>
            )}
          </div>
          <h3 className="entity-card-title">{item.title}</h3>
        </div>
        <Icon name="chevron-right" size={15} className="work-item-card-arrow" />
      </div>

      <p className="entity-card-summary work-item-card-summary">{summary}</p>

      <div className={`work-item-next-action${item.nextAction ? "" : " is-empty"}`}>
        <span>
          <Icon name="chevron-right" size={13} />
          下一步 / NEXT ACTION
        </span>
        <strong>{item.nextAction || "暂无下一步动作"}</strong>
      </div>

      <div className="entity-card-meta work-item-card-meta">
        <span>{WORK_ITEM_TYPE_LABELS[item.type] || item.type}</span>
        {item.project && <span>{item.project}</span>}
        {item.owner && (
          <span>
            <Icon name="user" size={11} />
            {item.owner}
          </span>
        )}
        {item.dueDate && (
          <span className={overdue ? "meta-overdue" : ""}>
            <Icon name="calendar" size={11} />
            {overdue ? "已逾期 · " : ""}
            {item.dueDate}
          </span>
        )}
        {item.module && <span>{item.module}</span>}
        {item.nextCheckpoint && (
          <span>
            <Icon name="calendar" size={11} />
            检查点 {item.nextCheckpoint}
          </span>
        )}
        {visibleTags.map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
        {hiddenTagCount > 0 && <span>+{hiddenTagCount}</span>}
      </div>
    </Link>
  );
}
