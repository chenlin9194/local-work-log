"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import WorkItemCard from "@/components/WorkItemCard";
import Icon from "@/components/Icon";
import PageLoadingState from "@/components/PageLoadingState";
import {
  WORK_ITEM_TYPES,
  PRIORITIES,
  STATUSES,
  MODULES,
  HEALTH_OPTIONS,
  REPORT_LEVEL_OPTIONS,
  SOURCE_SYSTEM_OPTIONS,
  PRIORITY_LABELS,
  HEALTH_LABELS,
  STATUS_LABELS,
  WORK_ITEM_TYPE_LABELS,
  REPORT_LEVEL_LABELS,
  SOURCE_SYSTEM_LABELS,
} from "@/lib/constants";
import { buildItemsQueryString } from "@/lib/filterLinks";

type ItemFilters = {
  projectId: string;
  project: string;
  module: string;
  type: string;
  visibility: string;
  priority: string;
  status: string;
  owner: string;
  health: string;
  reportLevel: string;
  sourceSystem: string;
  keyword: string;
  overdue: boolean;
};

interface WorkItem {
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
  health: string;
  currentSummary?: string | null;
  nextCheckpoint?: string | null;
  reportLevel: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

const DEFAULT_FILTERS: ItemFilters = {
  projectId: "",
  project: "",
  module: "",
  type: "",
  visibility: "open",
  priority: "",
  status: "",
  owner: "",
  health: "",
  reportLevel: "",
  sourceSystem: "",
  keyword: "",
  overdue: false,
};

function readItemFilters(searchParams: URLSearchParams): ItemFilters {
  return {
    projectId: searchParams.get("projectId") || "",
    project: searchParams.get("project") || "",
    module: searchParams.get("module") || "",
    type: searchParams.get("type") || "",
    visibility: searchParams.get("visibility") || "open",
    priority: searchParams.get("priority") || "",
    status: searchParams.get("status") || "",
    owner: searchParams.get("owner") || "",
    health: searchParams.get("health") || "",
    reportLevel: searchParams.get("reportLevel") || "",
    sourceSystem: searchParams.get("sourceSystem") || "",
    keyword: searchParams.get("keyword") || "",
    overdue: searchParams.get("overdue") === "true",
  };
}

function formatCombinedLabel(value: string, labels: Record<string, string>) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => labels[item] || item)
    .join(" / ");
}

function buildActiveFilterLabels(filters: ItemFilters) {
  const activeLabels: string[] = [];

  if (filters.projectId) activeLabels.push("项目范围");
  else if (filters.project) activeLabels.push(`项目：${filters.project}`);
  if (filters.keyword) activeLabels.push(`关键词：${filters.keyword}`);
  if (filters.visibility === "open") activeLabels.push("未关闭");
  else if (filters.visibility === "closed") activeLabels.push("仅已关闭");
  else if (filters.visibility === "all") activeLabels.push("全部事项");
  if (filters.type) activeLabels.push(`类型：${WORK_ITEM_TYPE_LABELS[filters.type] || filters.type}`);
  if (filters.priority) activeLabels.push(`优先级：${formatCombinedLabel(filters.priority, PRIORITY_LABELS)}`);
  if (filters.status) activeLabels.push(`状态：${STATUS_LABELS[filters.status] || filters.status}`);
  if (filters.health) activeLabels.push(`健康度：${formatCombinedLabel(filters.health, HEALTH_LABELS)}`);
  if (filters.reportLevel) activeLabels.push(`汇报层级：${REPORT_LEVEL_LABELS[filters.reportLevel] || filters.reportLevel}`);
  if (filters.sourceSystem) activeLabels.push(`来源：${SOURCE_SYSTEM_LABELS[filters.sourceSystem] || filters.sourceSystem}`);
  if (filters.module) activeLabels.push(`模块：${filters.module}`);
  if (filters.owner) activeLabels.push(`责任人：${filters.owner}`);
  if (filters.overdue) activeLabels.push("仅显示逾期");

  return activeLabels;
}

export default function ItemsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [urlFiltersInitialized, setUrlFiltersInitialized] = useState(false);
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildItemsQueryString(filters, { page, pageSize: 20 });
      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    setFilters(readItemFilters(new URLSearchParams(window.location.search)));
    setUrlFiltersInitialized(true);
  }, []);

  useEffect(() => {
    if (!urlFiltersInitialized) return;

    const delay = filters.keyword ? 250 : 0;
    const timer = window.setTimeout(() => {
      fetchItems();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [fetchItems, filters.keyword, urlFiltersInitialized]);

  useEffect(() => {
    if (!urlFiltersInitialized) return;

    const syncUrl = () => {
      const nextQuery = buildItemsQueryString(filters);
      const currentQuery = window.location.search.startsWith("?") ? window.location.search.slice(1) : "";
      if (currentQuery === nextQuery) return;

      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextHref, { scroll: false });
    };

    const delay = filters.keyword ? 250 : 0;
    const timer = window.setTimeout(syncUrl, delay);
    return () => window.clearTimeout(timer);
  }, [filters, page, pathname, router, urlFiltersInitialized]);

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const applyQuickView = (nextFilters: Partial<ItemFilters>) => {
    setFilters({ ...DEFAULT_FILTERS, ...nextFilters });
    setPage(1);
  };

  const copyMarkdown = () => {
    let md = "# 工作事项列表\n\n";
    items.forEach((item) => {
      md += `## ${item.title}\n`;
      md += `- **类型**: ${item.type} | **优先级**: ${item.priority} | **状态**: ${item.status}\n`;
      if (item.project) md += `- **项目**: ${item.project}\n`;
      if (item.owner) md += `- **责任人**: ${item.owner}\n`;
      if (item.dueDate) md += `- **截止日期**: ${item.dueDate}\n`;
      md += "\n";
    });
    navigator.clipboard.writeText(md);
    alert("已复制到剪贴板");
  };

  const activeFilterLabels = buildActiveFilterLabels(filters);

  return (
    <div className="command-list-page item-list-page">
      {/* Header */}
      <div className="command-page-header">
        <div>
          <span className="section-eyebrow">EXECUTION QUEUE</span>
          <h1>工作事项</h1>
          <p>跟踪风险、问题、待办与跨团队依赖的闭环状态。</p>
        </div>
        <div className="page-header-actions">
          <button onClick={copyMarkdown} className="btn btn-secondary list-action-button">
            <Icon name="copy" size={14} />复制 Markdown
          </button>
          <Link href="/items/new" className="btn btn-primary"><Icon name="plus" size={14} />新建跟踪事项</Link>
        </div>
      </div>

      <div className="card item-quick-view-panel">
        <div className="item-quick-view-head">
          <span>快速视图</span>
          <strong>先看需要处理的事项</strong>
        </div>
        <div className="item-quick-view-actions">
          <button type="button" onClick={() => applyQuickView({ visibility: "open" })} className="btn btn-secondary">未关闭</button>
          <button type="button" onClick={() => applyQuickView({ visibility: "open", priority: "P0" })} className="btn btn-secondary">P0 高优</button>
          <button type="button" onClick={() => applyQuickView({ visibility: "open", status: "blocked" })} className="btn btn-secondary">阻塞</button>
          <button type="button" onClick={() => applyQuickView({ visibility: "open", health: "red" })} className="btn btn-secondary">风险红</button>
          <button type="button" onClick={() => applyQuickView({ visibility: "open", overdue: true })} className="btn btn-secondary">逾期</button>
          <button type="button" onClick={() => applyQuickView({ visibility: "open", reportLevel: "daily" })} className="btn btn-secondary">进入日报</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card filter-panel item-filter-panel">
        <div className="filter-panel-label"><Icon name="search" size={14} />高级筛选</div>
        {activeFilterLabels.length > 0 && (
          <div className="filter-scope-note active-filter-summary">
            {activeFilterLabels.map((label) => (
              <span key={label} className="entity-pill entity-pill--muted">{label}</span>
            ))}
          </div>
        )}
        <div className="filter-grid">
          <input
            type="text"
            placeholder="关键词搜索"
            value={filters.keyword}
            onChange={(e) => handleFilterChange("keyword", e.target.value)}
          />
          <select
            value={filters.visibility}
            onChange={(e) => handleFilterChange("visibility", e.target.value)}
          >
            <option value="open">默认未关闭</option>
            <option value="closed">仅已关闭</option>
            <option value="all">全部事项</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">全部类型</option>
            {WORK_ITEM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
          >
            <option value="">全部优先级</option>
            <option value="P0,P1">P0/P1</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">全部状态</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filters.health}
            onChange={(e) => handleFilterChange("health", e.target.value)}
          >
            <option value="">全部健康度</option>
            <option value="red,yellow">风险/关注</option>
            {HEALTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.reportLevel}
            onChange={(e) => handleFilterChange("reportLevel", e.target.value)}
          >
            <option value="">全部汇报层级</option>
            {REPORT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.sourceSystem}
            onChange={(e) => handleFilterChange("sourceSystem", e.target.value)}
          >
            <option value="">全部来源系统</option>
            {SOURCE_SYSTEM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={filters.module}
            onChange={(e) => handleFilterChange("module", e.target.value)}
          >
            <option value="">全部模块</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="责任人"
            value={filters.owner}
            onChange={(e) => handleFilterChange("owner", e.target.value)}
          />
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => handleFilterChange("overdue", e.target.checked)}
            />
            仅显示逾期
          </label>
          <button onClick={clearFilters} className="btn btn-ghost">
            清除筛选
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="command-list-count">
        共 {total} 条记录
      </div>

      {/* Items List */}
      {loading ? (
        <PageLoadingState
          title="加载事项列表..."
          description="正在读取筛选后的事项与当前状态。"
          rows={4}
        />
      ) : items.length === 0 ? (
        <div className="card empty-state compact-list-empty">
          <div className="empty-icon"><Icon name="clipboard-list" size={25} /></div>
          <strong>当前没有匹配的工作事项</strong>
          <p>新建需要持续跟踪的事项，或先记录今天发生的事实。</p>
          <div className="empty-actions">
            <Link href="/items/new" className="btn btn-primary">新建跟踪事项</Link>
            <Link href="/logs/new" className="btn btn-secondary">先记录一条日志</Link>
          </div>
        </div>
      ) : (
        <div className="content-card-grid">
          {items.map((item) => (
            <WorkItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="pagination-row">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            上一页
          </button>
          <span className="pagination-status">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="btn btn-secondary"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
