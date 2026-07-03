"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import Timeline from "@/components/Timeline";
import PageLoadingState from "@/components/PageLoadingState";
import {
  WORK_ITEM_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  HEALTH_LABELS,
  REPORT_LEVEL_LABELS,
  SOURCE_SYSTEM_LABELS,
} from "@/lib/constants";
import { isOverdue, generateWorkItemMarkdown } from "@/lib/utils";
import AutoLinkText from "@/components/AutoLinkText";
import ActionItemSection from "@/components/ActionItemSection";
import { itemToAddLogHref, itemToLogsHref } from "@/lib/signalMap";

interface WorkItem {
  id: string;
  title: string;
  description?: string | null;
  project?: string | null;
  projectId?: string | null;
  module?: string | null;
  type: string;
  priority: string;
  status: string;
  owner?: string | null;
  dueDate?: string | null;
  nextAction?: string | null;
  tags?: string | null;
  trackingReason?: string | null;
  sourceSystem?: string | null;
  sourceId?: string | null;
  sourceUrl?: string | null;
  health: string;
  currentSummary?: string | null;
  nextCheckpoint?: string | null;
  reportLevel: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
  logs: {
    id: string;
    workDate: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
  }[];
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [item, setItem] = useState<WorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const actionInFlightRef = useRef(false);
  const [deleting, setDeleting] = useState(false);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);
      } else {
        alert("事项不存在");
        router.push("/items");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleStatusChange = async (newStatus: string) => {
    if (!item || actionInFlightRef.current) return;

    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchItem();
      } else {
        alert("更新失败");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!item || actionInFlightRef.current) return;
    if (!confirm("确定删除此事项？关联的日志不会被删除。")) return;

    const button = e.currentTarget;
    actionInFlightRef.current = true;
    button.disabled = true;
    button.textContent = "删除中...";
    setDeleting(true);
    let shouldRestoreButton = true;

    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        shouldRestoreButton = false;
        window.location.assign("/items");
        return;
      } else {
        alert("删除失败，请重试");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      if (shouldRestoreButton) {
        actionInFlightRef.current = false;
        button.disabled = false;
        button.textContent = "删除";
        setDeleting(false);
      }
    }
  };

  const copyMarkdown = () => {
    if (!item) return;
    const md = generateWorkItemMarkdown(item);
    navigator.clipboard.writeText(md);
    alert("已复制到剪贴板");
  };

  if (loading) {
    return (
      <PageLoadingState
        title="加载事项详情..."
        description="正在读取事项主体、时间线和关联记录。"
        rows={5}
      />
    );
  }

  if (!item) {
    return null;
  }

  const overdue = isOverdue(item.dueDate, item.status);
  const addLogHref = itemToAddLogHref(item.id, item.projectId ?? undefined);

  return (
    <div className="detail-page detail-page--item">
      <header className="card detail-header">
        <div className="detail-header-main">
          <Link href="/items" className="detail-back-link">
            <Icon name="arrow-left" size={14} />
            返回列表
          </Link>
          <div className="detail-title-row">
            <span className="section-eyebrow">WORK ITEM</span>
            <h1 className="detail-title">{item.title}</h1>
          </div>
          <div className="detail-status-row">
            <span className={`badge badge-${item.priority.toLowerCase()}`}>
              {PRIORITY_LABELS[item.priority] || item.priority}
            </span>
            <span className={`badge badge-${item.status}`}>
              {STATUS_LABELS[item.status] || item.status}
            </span>
            <span className="entity-pill entity-pill--muted">
              {WORK_ITEM_TYPE_LABELS[item.type] || item.type}
            </span>
            <span className="entity-pill entity-pill--muted">
              {HEALTH_LABELS[item.health] || item.health}
            </span>
            {overdue && <span className="badge badge-overdue">逾期</span>}
          </div>
        </div>
        <div className="detail-actions">
          <button onClick={copyMarkdown} className="btn btn-secondary">
            <Icon name="copy" size={14} />
            复制 Markdown
          </button>
          <Link href={`/items/${item.id}/edit`} className="btn btn-secondary">
            <Icon name="edit" size={14} />
            编辑
          </Link>
          <Link href={addLogHref} className="btn btn-primary">
            <Icon name="plus" size={14} />
            添加日志
          </Link>
          <button onClick={handleDelete} className="btn btn-danger" disabled={deleting}>
            {deleting ? (
              "删除中..."
            ) : (
              <>
                <Icon name="trash" size={14} />
                删除
              </>
            )}
          </button>
        </div>
      </header>

      <div className="card detail-main-card">
        {item.description && (
          <div className="detail-copy-block">
            <div className="detail-field-label">事项描述</div>
            <p className="detail-body-text">
              <AutoLinkText text={item.description} />
            </p>
          </div>
        )}

        {(item.currentSummary || item.trackingReason || item.nextAction) && (
          <div className="detail-insight-grid">
            {item.currentSummary && (
              <div className="detail-insight-panel">
                <div className="detail-field-label">当前摘要</div>
                <div className="detail-field-value detail-field-value--body">
                  <AutoLinkText text={item.currentSummary} />
                </div>
              </div>
            )}
            {item.nextAction && (
              <div className="detail-insight-panel detail-insight-panel--accent">
                <div className="detail-field-label">Next Action</div>
                <div className="detail-field-value detail-field-value--strong">
                  <AutoLinkText text={item.nextAction} />
                </div>
              </div>
            )}
            {item.trackingReason && (
              <div className="detail-insight-panel">
                <div className="detail-field-label">跟踪原因</div>
                <div className="detail-field-value detail-field-value--body">
                  <AutoLinkText text={item.trackingReason} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="detail-meta-grid">
          <div className="detail-meta-item">
            <span>健康度</span>
            <strong>{HEALTH_LABELS[item.health] || item.health}</strong>
          </div>
          <div className="detail-meta-item">
            <span>汇报层级</span>
            <strong>{REPORT_LEVEL_LABELS[item.reportLevel] || item.reportLevel}</strong>
          </div>
          {item.sourceSystem && (
            <div className="detail-meta-item">
              <span>来源系统</span>
              <strong>{SOURCE_SYSTEM_LABELS[item.sourceSystem] || item.sourceSystem}</strong>
            </div>
          )}
          {item.sourceId && (
            <div className="detail-meta-item">
              <span>来源编号</span>
              <strong>{item.sourceId}</strong>
            </div>
          )}
          {item.nextCheckpoint && (
            <div className="detail-meta-item">
              <span>下个检查点</span>
              <strong>{item.nextCheckpoint}</strong>
            </div>
          )}
          {item.project && (
            <div className="detail-meta-item">
              <span>项目</span>
              <strong>{item.project}</strong>
            </div>
          )}
          {item.module && (
            <div className="detail-meta-item">
              <span>模块</span>
              <strong>{item.module}</strong>
            </div>
          )}
          {item.owner && (
            <div className="detail-meta-item">
              <span>负责人</span>
              <strong>{item.owner}</strong>
            </div>
          )}
          {item.dueDate && (
            <div className={`detail-meta-item ${overdue ? "detail-meta-item--danger" : ""}`}>
              <span>截止日期</span>
              <strong>{item.dueDate}</strong>
            </div>
          )}
          {item.sourceUrl && (
            <div className="detail-meta-item detail-meta-item--wide">
              <span>来源链接</span>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                打开来源链接
              </a>
            </div>
          )}
          <div className="detail-meta-item">
            <span>创建时间</span>
            <strong>{new Date(item.createdAt).toLocaleString("zh-CN")}</strong>
          </div>
          <div className="detail-meta-item">
            <span>更新时间</span>
            <strong>{new Date(item.updatedAt).toLocaleString("zh-CN")}</strong>
          </div>
        </div>

        {item.tags && (
          <div className="detail-tag-row">
            {item.tags.split(",").map((tag, index) => (
              <span key={index} className="entity-pill entity-pill--muted">
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      <ActionItemSection workItemId={item.id} projectId={item.projectId ?? undefined} />

      <div className="card detail-section-card">
        <div className="detail-section-heading">
          <div>
            <span className="section-eyebrow">ACTIONS</span>
            <h2>快速操作</h2>
          </div>
        </div>
        <div className="detail-actions detail-actions--inline">
          {item.status !== "open" && (
            <button onClick={() => handleStatusChange("open")} className="btn btn-secondary">
              设为待处理
            </button>
          )}
          {item.status !== "following" && (
            <button onClick={() => handleStatusChange("following")} className="btn btn-secondary">
              设为跟进中
            </button>
          )}
          {item.status !== "blocked" && (
            <button onClick={() => handleStatusChange("blocked")} className="btn btn-secondary">
              设为已阻塞
            </button>
          )}
          {item.status !== "closed" && (
            <button onClick={() => handleStatusChange("closed")} className="btn btn-primary">
              标记为已关闭
            </button>
          )}
        </div>
      </div>

      <div className="card detail-section-card">
        <div className="detail-section-heading">
          <div>
            <span className="section-eyebrow">TIMELINE</span>
            <h2>关联日志时间线</h2>
          </div>
          <Link href={itemToLogsHref(item.id)} className="section-link">
            查看全部 <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <Timeline logs={item.logs} />
      </div>
    </div>
  );
}
