/**
 * Shared Markdown generation helpers for export pages and API routes.
 * Centralised here to avoid duplication between:
 *   - src/app/export/today/page.tsx
 *   - src/app/api/export/today/route.ts
 *   - src/app/export/range/page.tsx
 *   - src/app/api/export/range/route.ts
 */

import {
  WORK_LOG_TYPE_LABELS,
  WORK_ITEM_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  SOURCE_LABELS,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Shared sub-types (minimal shape expected by the generators)
// ---------------------------------------------------------------------------

interface LogEntry {
  title: string;
  workDate: string;
  type: string;
  source: string;
  project?: string | null;
  module?: string | null;
  tags?: string | null;
  content: string;
  item?: { title: string } | null;
}

interface ItemEntry {
  title: string;
  type: string;
  priority: string;
  status: string;
  owner?: string | null;
  dueDate?: string | null;
  nextAction?: string | null;
  tags?: string | null;
  description?: string | null;
  closedAt?: Date | null;
}

// ---------------------------------------------------------------------------
// Today export
// ---------------------------------------------------------------------------

export interface TodayExportData {
  today: string;
  workLogs: LogEntry[];
  closedItems: ItemEntry[];
  updatedItems: ItemEntry[];
  openHighPriorityItems: ItemEntry[];
  dueTodayItems: ItemEntry[];
  overdueItems: ItemEntry[];
  riskAndBlockerLogs: LogEntry[];
  decisionLogs: LogEntry[];
}

export function generateTodayMarkdown(data: TodayExportData): string {
  const {
    today,
    workLogs,
    closedItems,
    updatedItems,
    openHighPriorityItems,
    dueTodayItems,
    overdueItems,
    riskAndBlockerLogs,
    decisionLogs,
  } = data;

  let md = `# 今日工作汇总 - ${today}\n\n`;

  // AI Prompt
  md += `## AI 日报提示词\n\n`;
  md += `请根据以下今日工作数据，生成一份简洁的日报。要求：\n`;
  md += `1. 总结今日主要工作成果\n`;
  md += `2. 列出关键决策和风险\n`;
  md += `3. 明日工作计划\n`;
  md += `4. 需要协调的事项\n\n`;

  // Overview
  md += `## 概览\n\n`;
  md += `- 今日新增日志: ${workLogs.length} 条\n`;
  md += `- 今日关闭事项: ${closedItems.length} 项\n`;
  md += `- 今日更新事项: ${updatedItems.length} 项\n`;
  md += `- P0/P1 未关闭: ${openHighPriorityItems.length} 项\n`;
  md += `- 今日到期: ${dueTodayItems.length} 项\n`;
  md += `- 逾期未关闭: ${overdueItems.length} 项\n\n`;

  // 一、今日新增日志
  if (workLogs.length > 0) {
    md += `## 一、今日新增日志\n\n`;
    workLogs.forEach((log) => {
      md += `### ${log.title}\n`;
      md += `- 日期: ${log.workDate} | 类型: ${WORK_LOG_TYPE_LABELS[log.type] || log.type} | 来源: ${SOURCE_LABELS[log.source] || log.source}\n`;
      if (log.project) md += `- 项目: ${log.project}`;
      if (log.module) md += ` | 模块: ${log.module}`;
      if (log.project || log.module) md += "\n";
      if (log.tags) md += `- 标签: ${log.tags}\n`;
      if (log.item) md += `- 关联事项: ${log.item.title}\n`;
      md += `\n${log.content}\n\n`;
    });
  }

  // 二、今日关闭事项
  if (closedItems.length > 0) {
    md += `## 二、今日关闭事项\n\n`;
    closedItems.forEach((item) => {
      md += `### ${item.title}\n`;
      md += `- 类型: ${WORK_ITEM_TYPE_LABELS[item.type] || item.type} | 优先级: ${PRIORITY_LABELS[item.priority] || item.priority} | 状态: ${STATUS_LABELS[item.status] || item.status}\n`;
      if (item.owner) md += `- 责任人: ${item.owner}\n`;
      if (item.dueDate) md += `- 截止日期: ${item.dueDate}\n`;
      if (item.nextAction) md += `- 下一步: ${item.nextAction}\n`;
      if (item.tags) md += `- 标签: ${item.tags}\n`;
      if (item.description) md += `\n${item.description}\n`;
      md += "\n";
    });
  }

  // 三、今日更新事项
  if (updatedItems.length > 0) {
    md += `## 三、今日更新事项\n\n`;
    updatedItems.forEach((item) => {
      md += `### ${item.title}\n`;
      md += `- 类型: ${WORK_ITEM_TYPE_LABELS[item.type] || item.type} | 优先级: ${PRIORITY_LABELS[item.priority] || item.priority} | 状态: ${STATUS_LABELS[item.status] || item.status}\n`;
      if (item.owner) md += `- 责任人: ${item.owner}\n`;
      if (item.dueDate) md += `- 截止日期: ${item.dueDate}\n`;
      if (item.nextAction) md += `- 下一步: ${item.nextAction}\n`;
      if (item.tags) md += `- 标签: ${item.tags}\n`;
      md += "\n";
    });
  }

  // 四、当前 P0/P1 未关闭事项
  if (openHighPriorityItems.length > 0) {
    md += `## 四、当前 P0/P1 未关闭事项\n\n`;
    openHighPriorityItems.forEach((item) => {
      md += `### ${item.title}\n`;
      md += `- 类型: ${WORK_ITEM_TYPE_LABELS[item.type] || item.type} | 优先级: ${PRIORITY_LABELS[item.priority] || item.priority} | 状态: ${STATUS_LABELS[item.status] || item.status}\n`;
      if (item.owner) md += `- 责任人: ${item.owner}\n`;
      if (item.dueDate) md += `- 截止日期: ${item.dueDate}\n`;
      if (item.nextAction) md += `- 下一步: ${item.nextAction}\n`;
      if (item.tags) md += `- 标签: ${item.tags}\n`;
      if (item.description) md += `\n${item.description}\n`;
      md += "\n";
    });
  }

  // 五、今日到期事项
  if (dueTodayItems.length > 0) {
    md += `## 五、今日到期事项\n\n`;
    dueTodayItems.forEach((item) => {
      md += `- **${item.title}** (${PRIORITY_LABELS[item.priority] || item.priority}) - ${STATUS_LABELS[item.status] || item.status}`;
      if (item.owner) md += ` - 责任人: ${item.owner}`;
      md += "\n";
    });
    md += "\n";
  }

  // 六、逾期未关闭事项
  if (overdueItems.length > 0) {
    md += `## 六、逾期未关闭事项\n\n`;
    overdueItems.forEach((item) => {
      md += `- **${item.title}** - 截止: ${item.dueDate} (${PRIORITY_LABELS[item.priority] || item.priority}) - ${STATUS_LABELS[item.status] || item.status}`;
      if (item.owner) md += ` - 责任人: ${item.owner}`;
      md += "\n";
    });
    md += "\n";
  }

  // 七、今日风险/阻塞
  if (riskAndBlockerLogs.length > 0) {
    md += `## 七、今日风险/阻塞\n\n`;
    riskAndBlockerLogs.forEach((log) => {
      md += `### ${log.title}\n`;
      md += `- 类型: ${WORK_LOG_TYPE_LABELS[log.type] || log.type} | 来源: ${SOURCE_LABELS[log.source] || log.source}\n`;
      if (log.project) md += `- 项目: ${log.project}\n`;
      if (log.item) md += `- 关联事项: ${log.item.title}\n`;
      md += `\n${log.content}\n\n`;
    });
  }

  // 八、今日决策
  if (decisionLogs.length > 0) {
    md += `## 八、今日决策\n\n`;
    decisionLogs.forEach((log) => {
      md += `### ${log.title}\n`;
      md += `- 来源: ${SOURCE_LABELS[log.source] || log.source}\n`;
      if (log.project) md += `- 项目: ${log.project}\n`;
      if (log.item) md += `- 关联事项: ${log.item.title}\n`;
      md += `\n${log.content}\n\n`;
    });
  }

  return md;
}

// ---------------------------------------------------------------------------
// Range export
// ---------------------------------------------------------------------------

export interface RangeExportData {
  start: string;
  end: string;
  workLogs: LogEntry[];
  closedItems: ItemEntry[];
  updatedItems: ItemEntry[];
}

export function generateRangeMarkdown(data: RangeExportData): string {
  const { start, end, workLogs, closedItems, updatedItems } = data;

  let md = `# 工作汇总 - ${start} 至 ${end}\n\n`;

  // AI Prompt
  md += `## AI 周报提示词\n\n`;
  md += `请根据以下本周工作数据，生成一份结构清晰的周报。要求：\n`;
  md += `1. 本周工作总结\n`;
  md += `2. 关键成果和里程碑\n`;
  md += `3. 风险和问题\n`;
  md += `4. 下周工作计划\n`;
  md += `5. 需要协调的事项\n\n`;

  // Summary
  md += `## 概览\n\n`;
  md += `- 日志数量: ${workLogs.length} 条\n`;
  md += `- 关闭事项: ${closedItems.length} 项\n`;
  md += `- 更新事项: ${updatedItems.length} 项\n\n`;

  // Group logs by date
  const logsByDate = workLogs.reduce((acc, log) => {
    if (!acc[log.workDate]) acc[log.workDate] = [];
    acc[log.workDate].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  const dates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  // 一、工作日志
  if (dates.length > 0) {
    md += `## 一、工作日志\n\n`;
    dates.forEach((date) => {
      md += `### ${date}\n\n`;
      logsByDate[date].forEach((log) => {
        md += `#### ${log.title}\n`;
        md += `- 日期: ${log.workDate} | 类型: ${WORK_LOG_TYPE_LABELS[log.type] || log.type} | 来源: ${SOURCE_LABELS[log.source] || log.source}\n`;
        if (log.project) md += `- 项目: ${log.project}`;
        if (log.module) md += ` | 模块: ${log.module}`;
        if (log.project || log.module) md += "\n";
        if (log.tags) md += `- 标签: ${log.tags}\n`;
        if (log.item) md += `- 关联事项: ${log.item.title}\n`;
        md += `\n${log.content}\n\n`;
      });
    });
  }

  // 二、关闭事项
  if (closedItems.length > 0) {
    md += `## 二、关闭事项\n\n`;
    closedItems.forEach((item) => {
      md += `### ${item.title}\n`;
      md += `- 类型: ${WORK_ITEM_TYPE_LABELS[item.type] || item.type} | 优先级: ${PRIORITY_LABELS[item.priority] || item.priority}\n`;
      if (item.owner) md += `- 责任人: ${item.owner}\n`;
      if (item.closedAt) md += `- 关闭时间: ${item.closedAt.toISOString().split("T")[0]}\n`;
      if (item.description) md += `\n${item.description}\n`;
      md += "\n";
    });
  }

  // 三、更新事项
  if (updatedItems.length > 0) {
    md += `## 三、更新事项\n\n`;
    updatedItems.forEach((item) => {
      md += `- **${item.title}** - ${STATUS_LABELS[item.status] || item.status} (${PRIORITY_LABELS[item.priority] || item.priority})\n`;
    });
    md += "\n";
  }

  return md;
}
