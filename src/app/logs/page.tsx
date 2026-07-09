"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import WorkLogCard from "@/components/WorkLogCard";
import Icon from "@/components/Icon";
import PageLoadingState from "@/components/PageLoadingState";
import { WORK_LOG_TYPES, SOURCES, MODULES, WORK_LOG_TYPE_LABELS, SOURCE_LABELS } from "@/lib/constants";
import { buildLogsQueryString } from "@/lib/filterLinks";
import { getLocalDateString } from "@/lib/utils";

type LogFilters = {
  startDate: string;
  endDate: string;
  projectId: string;
  project: string;
  itemId: string;
  module: string;
  type: string;
  source: string;
  hasItem: string;
  reportable: string;
  view: string;
  keyword: string;
};

interface WorkLog {
  id: string;
  workDate: string;
  title: string;
  content: string;
  type: string;
  source: string;
  project?: string | null;
  module?: string | null;
  itemId?: string | null;
  item?: { id: string; title: string } | null;
  reportable: boolean;
  sourceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectOption {
  id: string;
  name: string;
  code?: string | null;
}

const DEFAULT_FILTERS: LogFilters = {
  startDate: "",
  endDate: "",
  projectId: "",
  project: "",
  itemId: "",
  module: "",
  type: "",
  source: "",
  hasItem: "",
  reportable: "",
  view: "facts",
  keyword: "",
};

const FACT_VIEW_OPTIONS = [
  { key: "facts", label: "关键事实", hint: "风险、阻塞、决策、问题与可汇报记录" },
  { key: "risk_blocker", label: "风险/阻塞", hint: "需要关注、升级或跨团队推动的异常事实" },
  { key: "decision", label: "决策", hint: "已经形成结论的记录" },
  { key: "reportable", label: "可汇报", hint: "可进入日报、周报或管理汇报的素材" },
  { key: "system", label: "系统动态", hint: "自动记录的事项状态变化，用于追溯" },
  { key: "all", label: "全部记录", hint: "包含人工日志与系统动态" },
] as const;

function readLogFilters(searchParams: URLSearchParams): LogFilters {
  return {
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    projectId: searchParams.get("projectId") || "",
    project: searchParams.get("project") || "",
    itemId: searchParams.get("itemId") || "",
    module: searchParams.get("module") || "",
    type: searchParams.get("type") || "",
    source: searchParams.get("source") || "",
    hasItem: searchParams.get("hasItem") || "",
    reportable: searchParams.get("reportable") || "",
    view: searchParams.get("view") || "facts",
    keyword: searchParams.get("keyword") || "",
  };
}

function getActiveView(filters: LogFilters) {
  if (filters.view === "facts") return "facts";
  if (filters.view === "risk_blocker") return "risk_blocker";
  if (filters.view === "system") return "system";
  if (filters.type === "decision") return "decision";
  if (filters.reportable === "true") return "reportable";
  return "all";
}

function buildActiveFilterLabels(filters: LogFilters, projects: ProjectOption[]) {
  const labels: string[] = [];
  const projectName = filters.projectId
    ? projects.find((project) => project.id === filters.projectId)?.name
    : filters.project;

  if (filters.startDate || filters.endDate) labels.push(`日期：${filters.startDate || "起"} ~ ${filters.endDate || "今"}`);
  if (filters.keyword) labels.push(`关键词：${filters.keyword}`);
  if (projectName) labels.push(`项目：${projectName}`);
  if (filters.itemId) labels.push("关联事项范围");
  if (filters.module) labels.push(`模块：${filters.module}`);
  if (filters.type) labels.push(`类型：${WORK_LOG_TYPE_LABELS[filters.type] || filters.type}`);
  if (filters.source) labels.push(`来源：${SOURCE_LABELS[filters.source] || filters.source}`);
  if (filters.reportable === "true") labels.push("仅可汇报");
  if (filters.reportable === "false") labels.push("仅不可汇报");
  if (filters.hasItem === "true") labels.push("已关联事项");
  if (filters.hasItem === "false") labels.push("未关联事项");
  return labels;
}

function groupLogsByDate(logs: WorkLog[]) {
  const groups = new Map<string, WorkLog[]>();
  logs.forEach((log) => {
    const current = groups.get(log.workDate) || [];
    current.push(log);
    groups.set(log.workDate, current);
  });
  return Array.from(groups.entries()).map(([date, items]) => ({ date, items }));
}

export default function LogsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const today = getLocalDateString();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [urlFiltersInitialized, setUrlFiltersInitialized] = useState(false);
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildLogsQueryString(filters, { page, pageSize: 20 });
      const res = await fetch(`/api/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    setFilters(readLogFilters(new URLSearchParams(window.location.search)));
    setUrlFiltersInitialized(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects?pageSize=100");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProjects(data.projects || []);
      } catch (error) {
        console.error("Error fetching projects for log filters:", error);
      }
    }

    fetchProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!urlFiltersInitialized) return;

    const delay = filters.keyword ? 250 : 0;
    const timer = window.setTimeout(() => {
      fetchLogs();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [fetchLogs, filters.keyword, urlFiltersInitialized]);

  useEffect(() => {
    if (!urlFiltersInitialized) return;

    const syncUrl = () => {
      const nextQuery = buildLogsQueryString(filters);
      const currentQuery = window.location.search.startsWith("?") ? window.location.search.slice(1) : "";
      if (currentQuery === nextQuery) return;

      const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextHref, { scroll: false });
    };

    const delay = filters.keyword ? 250 : 0;
    const timer = window.setTimeout(syncUrl, delay);
    return () => window.clearTimeout(timer);
  }, [filters, page, pathname, router, urlFiltersInitialized]);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleProjectChange = (value: string) => {
    if (value.startsWith("name:")) {
      setFilters((prev) => ({
        ...prev,
        projectId: "",
        project: value.slice(5),
      }));
      setPage(1);
      return;
    }

    const projectId = value.startsWith("id:") ? value.slice(3) : value;
    setFilters((prev) => ({
      ...prev,
      projectId,
      project: "",
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const applyQuickView = (nextFilters: Partial<LogFilters>) => {
    setFilters({ ...DEFAULT_FILTERS, ...nextFilters });
    setPage(1);
  };

  const applyView = (view: string) => {
    const scopedFilters = {
      projectId: filters.projectId,
      project: filters.project,
      itemId: filters.itemId,
      module: filters.module,
    };

    if (view === "facts") applyQuickView({ ...scopedFilters, view: "facts" });
    else if (view === "risk_blocker") applyQuickView({ ...scopedFilters, view: "risk_blocker" });
    else if (view === "decision") applyQuickView({ ...scopedFilters, view: "", type: "decision" });
    else if (view === "reportable") applyQuickView({ ...scopedFilters, view: "", reportable: "true" });
    else if (view === "system") applyQuickView({ ...scopedFilters, view: "system" });
    else applyQuickView({ ...scopedFilters, view: "" });
  };

  const copyMarkdown = () => {
    let md = "# 工作日志列表\n\n";
    logs.forEach((log) => {
      md += `## ${log.title}\n`;
      md += `- **日期**: ${log.workDate} | **类型**: ${log.type} | **来源**: ${log.source}\n`;
      if (log.project) md += `- **项目**: ${log.project}\n`;
      md += `\n${log.content}\n\n`;
    });
    navigator.clipboard.writeText(md);
    alert("已复制到剪贴板");
  };

  const activeView = getActiveView(filters);
  const activeViewHint = FACT_VIEW_OPTIONS.find((view) => view.key === activeView)?.hint;
  const activeFilterLabels = buildActiveFilterLabels(filters, projects);
  const projectSelectValue = filters.projectId ? `id:${filters.projectId}` : filters.project ? `name:${filters.project}` : "";
  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);

  return (
    <div className="command-list-page log-list-page log-evidence-page">
      <div className="command-page-header">
        <div>
          <span className="section-eyebrow">FACT TIMELINE</span>
          <h1>事实记录台</h1>
          <p>默认聚焦人工关键事实、风险阻塞、决策和可汇报证据；系统动态保留追溯，但不抢主视线。</p>
        </div>
        <div className="page-header-actions">
          <button onClick={copyMarkdown} className="btn btn-secondary list-action-button">
            <Icon name="copy" size={14} />
            复制 Markdown
          </button>
          <Link href="/logs/new" className="btn btn-primary">
            <Icon name="plus" size={14} />
            新增日志
          </Link>
        </div>
      </div>

      <div className="card log-quick-view-panel">
        <div className="log-quick-view-head">
          <span>证据视图</span>
          <strong>先看能支撑汇报、复盘和状态解释的事实</strong>
          {activeViewHint && <p>{activeViewHint}</p>}
        </div>
        <div className="log-quick-view-body">
          <div className="log-quick-group">
            <span className="log-quick-group-label">事实视图</span>
            <div className="log-quick-view-actions">
              {FACT_VIEW_OPTIONS.map((view) => (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => applyView(view.key)}
                  className={`log-filter-chip${activeView === view.key ? " is-active" : ""}`}
                  title={view.hint}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <div className="log-quick-group log-quick-group--scope">
            <span className="log-quick-group-label">范围入口</span>
            <div className="log-quick-view-actions">
              <button
                type="button"
                onClick={() => applyQuickView({ startDate: today, endDate: today, view: "" })}
                className={`log-filter-chip${filters.startDate === today && filters.endDate === today ? " is-active" : ""}`}
              >
                今日日志
              </button>
              <button
                type="button"
                onClick={() => applyQuickView({ hasItem: "false", view: "" })}
                className={`log-filter-chip${filters.hasItem === "false" ? " is-active" : ""}`}
              >
                未关联事项
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card filter-panel log-filter-panel">
        <div className="log-filter-toolbar">
          <div className="log-filter-search">
            <Icon name="search" size={14} />
            <input
              type="text"
              placeholder="搜索标题、正文、来源链接"
              value={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
            />
          </div>
          <input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
          <input type="date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
          <button type="button" className="btn btn-secondary log-filter-toggle" onClick={() => setShowAdvancedFilters((prev) => !prev)}>
            {showAdvancedFilters ? "收起高级筛选" : "展开高级筛选"}
          </button>
          {activeFilterLabels.length > 0 && (
            <button type="button" onClick={clearFilters} className="btn btn-ghost log-filter-clear">
              清除筛选
            </button>
          )}
        </div>

        {activeFilterLabels.length > 0 && (
          <div className="filter-scope-note active-filter-summary log-active-filter-summary">
            {activeFilterLabels.map((label) => (
              <span key={label} className="entity-pill entity-pill--muted">
                {label}
              </span>
            ))}
          </div>
        )}

        <div className={`filter-grid log-filter-advanced${showAdvancedFilters ? " is-open" : ""}`}>
          <select value={projectSelectValue} onChange={(e) => handleProjectChange(e.target.value)}>
            <option value="">全部项目</option>
            {filters.project && !filters.projectId && (
              <option value={`name:${filters.project}`}>{filters.project}</option>
            )}
            {projects.map((project) => (
              <option key={project.id} value={`id:${project.id}`}>
                {project.code ? `${project.code} · ${project.name}` : project.name}
              </option>
            ))}
          </select>
          <select value={filters.module} onChange={(e) => handleFilterChange("module", e.target.value)}>
            <option value="">全部模块</option>
            {MODULES.map((module) => (
              <option key={module} value={module}>
                {module}
              </option>
            ))}
          </select>
          <select value={filters.type} onChange={(e) => handleFilterChange("type", e.target.value)}>
            <option value="">全部类型</option>
            {WORK_LOG_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <select value={filters.source} onChange={(e) => handleFilterChange("source", e.target.value)}>
            <option value="">全部来源</option>
            {SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
          <select value={filters.reportable} onChange={(e) => handleFilterChange("reportable", e.target.value)}>
            <option value="">全部汇报状态</option>
            <option value="true">仅可汇报</option>
            <option value="false">仅不可汇报</option>
          </select>
          <select value={filters.hasItem} onChange={(e) => handleFilterChange("hasItem", e.target.value)}>
            <option value="">全部关联</option>
            <option value="true">已关联事项</option>
            <option value="false">未关联事项</option>
          </select>
        </div>
      </div>

      <div className="command-list-count">共 {total} 条记录</div>

      {loading ? (
        <PageLoadingState
          title="加载事实记录..."
          description="正在读取筛选后的日志与关联信息。"
          rows={4}
        />
      ) : logs.length === 0 ? (
        <div className="card empty-state compact-list-empty">
          <div className="empty-icon">
            <Icon name="file-text" size={25} />
          </div>
          <strong>当前没有匹配的工作日志</strong>
          <p>记录一条今天发生的事实，后续需要闭环时再关联事项或行动项。</p>
          <div className="empty-actions">
            <Link href="/logs/new" className="btn btn-primary">
              记录今日进展
            </Link>
          </div>
        </div>
      ) : (
        <div className="log-timeline-list">
          {groupedLogs.map((group) => (
            <section key={group.date} className="log-date-group">
              <div className="log-date-rail">
                <span>{group.date}</span>
                <small>{group.items.length} 条</small>
              </div>
              <div className="log-date-items">
                {group.items.map((log) => (
                  <WorkLogCard key={log.id} log={log} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="pagination-row">
          <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="btn btn-secondary">
            上一页
          </button>
          <span className="pagination-status">
            第 {page} 页 / 共 {Math.ceil(total / 20)} 页
          </span>
          <button onClick={() => setPage((prev) => prev + 1)} disabled={page * 20 >= total} className="btn btn-secondary">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
