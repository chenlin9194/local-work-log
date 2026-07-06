"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Icon from "@/components/Icon";
import {
  PROJECT_MILESTONE_STATUSES,
  PROJECT_MILESTONE_STATUS_LABELS,
  PROJECT_PLAN_TYPES,
  PROJECT_PLAN_TYPE_LABELS,
} from "@/lib/constants";
import { formatDate, getLocalDateString } from "@/lib/utils";
import type { ProjectMilestone } from "@/lib/types";

type MilestoneFormState = {
  title: string;
  description: string;
  status: string;
  planType: string;
  targetDate: string;
  actualDate: string;
  owner: string;
  sourceUrl: string;
  sortOrder: string;
};

const EMPTY_MILESTONE_FORM: MilestoneFormState = {
  title: "",
  description: "",
  status: "planned",
  planType: "milestone",
  targetDate: "",
  actualDate: "",
  owner: "",
  sourceUrl: "",
  sortOrder: "0",
};

const CLOSED_MILESTONE_STATUSES = new Set(["done", "cancelled"]);

const INPUT_STYLE = {
  width: "100%",
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid var(--border-primary)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: 13,
};

const TABLE_CELL_STYLE = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border-secondary)",
  verticalAlign: "middle" as const,
};

const TABLE_HEAD_CELL_STYLE = {
  padding: "8px 10px",
  borderBottom: "1px solid var(--border-primary)",
  color: "var(--text-tertiary)",
  fontSize: 12,
  fontWeight: 600,
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const ACTION_CELL_STYLE = {
  ...TABLE_CELL_STYLE,
  width: 132,
  whiteSpace: "nowrap" as const,
};

function toDateInputValue(value?: string | Date | null) {
  if (!value) return "";
  return formatDate(value, "iso");
}

function getMilestoneDateKey(value?: string | Date | null) {
  if (!value) return "";
  return formatDate(value, "iso");
}

function isMilestoneClosed(milestone: ProjectMilestone) {
  return CLOSED_MILESTONE_STATUSES.has(milestone.status);
}

function isMilestoneRisk(milestone: ProjectMilestone, today: string) {
  if (milestone.status === "delayed") return true;
  if (isMilestoneClosed(milestone)) return false;

  const targetDate = getMilestoneDateKey(milestone.targetDate);
  return Boolean(targetDate && targetDate < today);
}

function getMilestonePriority(milestone: ProjectMilestone, today: string) {
  if (isMilestoneRisk(milestone, today)) return 0;
  if (!isMilestoneClosed(milestone)) return 1;
  return 2;
}

function getMilestoneSearchText(milestone: ProjectMilestone) {
  return [
    milestone.title,
    PROJECT_PLAN_TYPE_LABELS[milestone.planType || "milestone"] || milestone.planType,
    PROJECT_MILESTONE_STATUS_LABELS[milestone.status] || milestone.status,
    milestone.owner,
    milestone.description,
    milestone.sourceUrl,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortMilestones(milestones: ProjectMilestone[], today: string) {
  return [...milestones].sort((a, b) => {
    const priorityDiff = getMilestonePriority(a, today) - getMilestonePriority(b, today);
    if (priorityDiff !== 0) return priorityDiff;

    const aTargetDate = getMilestoneDateKey(a.targetDate);
    const bTargetDate = getMilestoneDateKey(b.targetDate);
    if (aTargetDate && bTargetDate && aTargetDate !== bTargetDate) return aTargetDate.localeCompare(bTargetDate);
    if (aTargetDate && !bTargetDate) return -1;
    if (!aTargetDate && bTargetDate) return 1;

    const sortOrderDiff = a.sortOrder - b.sortOrder;
    if (sortOrderDiff !== 0) return sortOrderDiff;

    return a.title.localeCompare(b.title, "zh-CN");
  });
}

type ProjectMilestoneSectionProps = {
  projectId: string;
};

function MilestoneInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={INPUT_STYLE}
    />
  );
}

function MilestoneSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={INPUT_STYLE}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function MilestoneFormCells({
  form,
  setForm,
  saving,
  error,
  onSave,
  onCancel,
}: {
  form: MilestoneFormState;
  setForm: Dispatch<SetStateAction<MilestoneFormState>>;
  saving: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 126 }}>
        <MilestoneSelect
          value={form.status}
          onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
          options={PROJECT_MILESTONE_STATUSES}
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 150 }}>
        <MilestoneInput
          value={form.title}
          onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
          placeholder="节点名称 *"
        />
        {error && <div style={{ marginTop: 4, color: "var(--accent-red)", fontSize: 12 }}>{error}</div>}
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 130 }}>
        <MilestoneSelect
          value={form.planType}
          onChange={(value) => setForm((prev) => ({ ...prev, planType: value }))}
          options={PROJECT_PLAN_TYPES}
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 136 }}>
        <MilestoneInput
          type="date"
          value={form.targetDate}
          onChange={(value) => setForm((prev) => ({ ...prev, targetDate: value }))}
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 136 }}>
        <MilestoneInput
          type="date"
          value={form.actualDate}
          onChange={(value) => setForm((prev) => ({ ...prev, actualDate: value }))}
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 110 }}>
        <MilestoneInput
          value={form.owner}
          onChange={(value) => setForm((prev) => ({ ...prev, owner: value }))}
          placeholder="负责人"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 220 }}>
        <MilestoneInput
          value={form.description}
          onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
          placeholder="说明"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 180 }}>
        <MilestoneInput
          type="url"
          value={form.sourceUrl}
          onChange={(value) => setForm((prev) => ({ ...prev, sourceUrl: value }))}
          placeholder="关联链接"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, width: 82 }}>
        <MilestoneInput
          type="number"
          value={form.sortOrder}
          onChange={(value) => setForm((prev) => ({ ...prev, sortOrder: value }))}
          placeholder="排序"
        />
      </td>
      <td style={ACTION_CELL_STYLE}>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={onSave} className="btn btn-primary" disabled={saving} style={{ padding: "6px 9px" }}>
            {saving ? "保存中" : "保存"}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={saving} style={{ padding: "6px 9px" }}>
            取消
          </button>
        </div>
      </td>
    </>
  );
}

function MilestoneStatusMark({ milestone, today }: { milestone: ProjectMilestone; today: string }) {
  const isRisk = isMilestoneRisk(milestone, today);
  const isClosed = isMilestoneClosed(milestone);

  if (isRisk) {
    return <span title="延期/风险" style={{ color: "var(--accent-red)", fontWeight: 800 }}>!</span>;
  }

  if (milestone.status === "done") {
    return <span title="已完成" style={{ color: "var(--accent-green)", fontWeight: 800 }}>✓</span>;
  }

  if (milestone.status === "cancelled") {
    return <span title="已取消" style={{ color: "var(--text-tertiary)", fontWeight: 800 }}>×</span>;
  }

  return <span title={isClosed ? "已结束" : "未关闭"} style={{ color: "var(--text-tertiary)", fontWeight: 800 }}>○</span>;
}

export default function ProjectMilestoneSection({ projectId }: ProjectMilestoneSectionProps) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [milestonesError, setMilestonesError] = useState(false);
  const [milestoneActionError, setMilestoneActionError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showMilestoneCreateForm, setShowMilestoneCreateForm] = useState(false);
  const [milestoneCreateSaving, setMilestoneCreateSaving] = useState(false);
  const [milestoneCreateError, setMilestoneCreateError] = useState("");
  const [milestoneCreateForm, setMilestoneCreateForm] = useState<MilestoneFormState>(EMPTY_MILESTONE_FORM);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneEditSaving, setMilestoneEditSaving] = useState(false);
  const [milestoneEditError, setMilestoneEditError] = useState("");
  const [milestoneEditForm, setMilestoneEditForm] = useState<MilestoneFormState>(EMPTY_MILESTONE_FORM);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState("all");

  const today = getLocalDateString();

  const validateMilestoneForm = useCallback((form: MilestoneFormState) => {
    if (!form.title.trim()) return "里程碑名称不能为空";
    return "";
  }, []);

  const buildMilestonePayload = useCallback((form: MilestoneFormState) => {
    const sortOrderValue = Number(form.sortOrder);

    return {
      title: form.title.trim(),
      description: form.description,
      status: form.status.trim() || "planned",
      planType: form.planType.trim() || "milestone",
      targetDate: form.targetDate || null,
      actualDate: form.actualDate || null,
      owner: form.owner,
      sourceUrl: form.sourceUrl,
      sortOrder: Number.isFinite(sortOrderValue) ? sortOrderValue : 0,
    };
  }, []);

  const resetMilestoneCreateForm = useCallback(() => {
    setMilestoneCreateForm(EMPTY_MILESTONE_FORM);
    setMilestoneCreateError("");
  }, []);

  const resetMilestoneEditForm = useCallback(() => {
    setMilestoneEditForm(EMPTY_MILESTONE_FORM);
    setMilestoneEditError("");
  }, []);

  const fetchMilestones = useCallback(async () => {
    try {
      setMilestonesLoading(true);
      setMilestonesError(false);

      const res = await fetch(`/api/projects/${projectId}/milestones`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch project milestones: ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Project milestones response must be an array");

      setMilestones(data);
    } catch (error) {
      console.error("Error fetching project milestones:", error);
      setMilestonesError(true);
    } finally {
      setMilestonesLoading(false);
    }
  }, [projectId]);

  const refreshMilestonesAfterSave = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, { cache: "no-store" });
      if (!res.ok) return false;

      const data = await res.json();
      if (!Array.isArray(data)) return false;

      setMilestones(data);
      setMilestonesError(false);
      return true;
    } catch (error) {
      console.error("Error refreshing project milestones after save:", error);
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const openMilestoneCreateForm = () => {
    resetMilestoneEditForm();
    setEditingMilestoneId(null);
    setMilestoneActionError("");
    resetMilestoneCreateForm();
    setShowMilestoneCreateForm(true);
  };

  const closeMilestoneCreateForm = () => {
    resetMilestoneCreateForm();
    setShowMilestoneCreateForm(false);
  };

  const openMilestoneEditForm = (milestone: ProjectMilestone) => {
    closeMilestoneCreateForm();
    setMilestoneActionError("");
    setEditingMilestoneId(milestone.id);
    setMilestoneEditError("");
    setMilestoneEditForm({
      title: milestone.title,
      description: milestone.description || "",
      status: milestone.status,
      planType: milestone.planType || "milestone",
      targetDate: toDateInputValue(milestone.targetDate),
      actualDate: toDateInputValue(milestone.actualDate),
      owner: milestone.owner || "",
      sourceUrl: milestone.sourceUrl || "",
      sortOrder: String(milestone.sortOrder),
    });
  };

  const closeMilestoneEditForm = () => {
    resetMilestoneEditForm();
    setEditingMilestoneId(null);
  };

  const handleMilestoneCreateSubmit = async () => {
    if (milestoneCreateSaving) return;

    const validationError = validateMilestoneForm(milestoneCreateForm);
    if (validationError) {
      setMilestoneCreateError(validationError);
      return;
    }

    setMilestoneCreateSaving(true);
    setMilestoneCreateError("");
    setMilestoneActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildMilestonePayload(milestoneCreateForm)),
      });

      if (!res.ok) {
        setMilestoneCreateError("保存项目里程碑失败");
        return;
      }

      const createdMilestone = await res.json();
      setMilestones((prev) => sortMilestones([createdMilestone, ...prev], today));
      setMilestonesError(false);
      closeMilestoneCreateForm();
      await refreshMilestonesAfterSave();
    } catch (error) {
      console.error("Error creating project milestone:", error);
      setMilestoneCreateError("保存项目里程碑失败");
    } finally {
      setMilestoneCreateSaving(false);
    }
  };

  const handleMilestoneEditSubmit = async (milestoneId: string) => {
    if (milestoneEditSaving) return;

    const validationError = validateMilestoneForm(milestoneEditForm);
    if (validationError) {
      setMilestoneEditError(validationError);
      return;
    }

    setMilestoneEditSaving(true);
    setMilestoneEditError("");
    setMilestoneActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildMilestonePayload(milestoneEditForm)),
      });

      if (!res.ok) {
        setMilestoneEditError("更新项目里程碑失败");
        return;
      }

      const updatedMilestone = await res.json();
      setMilestones((prev) => sortMilestones(prev.map((milestone) => (milestone.id === milestoneId ? updatedMilestone : milestone)), today));
      setMilestonesError(false);
      closeMilestoneEditForm();
      await refreshMilestonesAfterSave();
    } catch (error) {
      console.error("Error updating project milestone:", error);
      setMilestoneEditError("更新项目里程碑失败");
    } finally {
      setMilestoneEditSaving(false);
    }
  };

  const handleMilestoneDelete = async (milestoneId: string) => {
    if (deletingMilestoneId) return;
    if (!confirm("确认删除这个项目里程碑吗？")) return;

    setDeletingMilestoneId(milestoneId);
    setMilestoneActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setMilestoneActionError("删除项目里程碑失败");
        return;
      }

      setMilestones((prev) => prev.filter((milestone) => milestone.id !== milestoneId));
      if (editingMilestoneId === milestoneId) closeMilestoneEditForm();
      await refreshMilestonesAfterSave();
    } catch (error) {
      console.error("Error deleting project milestone:", error);
      setMilestoneActionError("删除项目里程碑失败");
    } finally {
      setDeletingMilestoneId(null);
    }
  };

  const filteredByPlanType = useMemo(() => {
    if (selectedPlanType === "all") return milestones;
    return milestones.filter((milestone) => (milestone.planType || "milestone") === selectedPlanType);
  }, [milestones, selectedPlanType]);

  const normalizedKeyword = keyword.trim().toLowerCase();
  const displayedMilestones = useMemo(() => {
    const filteredByKeyword = normalizedKeyword
      ? filteredByPlanType.filter((milestone) => getMilestoneSearchText(milestone).includes(normalizedKeyword))
      : filteredByPlanType;

    return sortMilestones(filteredByKeyword, today);
  }, [filteredByPlanType, normalizedKeyword, today]);

  const sortedAllMilestones = useMemo(() => sortMilestones(milestones, today), [milestones, today]);
  const riskMilestoneCount = milestones.filter((milestone) => isMilestoneRisk(milestone, today)).length;
  const openMilestoneCount = milestones.filter((milestone) => !isMilestoneClosed(milestone)).length;
  const closedMilestoneCount = milestones.length - openMilestoneCount;
  const missingOwnerCount = milestones.filter((milestone) => !milestone.owner?.trim()).length;
  const nextKeyMilestone = sortedAllMilestones.find((milestone) => !isMilestoneClosed(milestone)) ?? null;

  return (
    <section className="cockpit-section">
      <div className="dashboard-section-title">
        <div>
          <span className="section-eyebrow">MILESTONES</span>
          <h2>项目里程碑</h2>
        </div>
        {!showMilestoneCreateForm && (
          <button
            type="button"
            onClick={() => {
              closeMilestoneEditForm();
              openMilestoneCreateForm();
            }}
            className="btn btn-secondary"
          >
            <Icon name="plus" size={14} />
            新增里程碑
          </button>
        )}
      </div>

      <div className="card entity-card entity-card--compact" style={{ padding: 12, marginBottom: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ minWidth: 260, flex: "2 1 360px", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-primary)" }}>下一节点：</strong>
            {nextKeyMilestone ? (
              <>
                {nextKeyMilestone.title}
                {nextKeyMilestone.targetDate ? ` · 目标 ${formatDate(nextKeyMilestone.targetDate)}` : ""}
                {nextKeyMilestone.owner ? ` · ${nextKeyMilestone.owner}` : ""}
              </>
            ) : (
              "暂无未关闭节点"
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            <span className="entity-pill entity-pill--muted">总数 {milestones.length}</span>
            <span className={riskMilestoneCount > 0 ? "entity-pill entity-pill--danger" : "entity-pill entity-pill--success"}>风险 {riskMilestoneCount}</span>
            <span className="entity-pill entity-pill--muted">未关闭 {openMilestoneCount}</span>
            <span className="entity-pill entity-pill--muted">已结束 {closedMilestoneCount}</span>
            {missingOwnerCount > 0 && <span className="entity-pill entity-pill--muted">负责人未填 {missingOwnerCount}</span>}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => setSelectedPlanType("all")}
              className={`btn ${selectedPlanType === "all" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "6px 10px" }}
            >
              全部
            </button>
            {PROJECT_PLAN_TYPES.map((planType) => (
              <button
                key={planType.value}
                type="button"
                onClick={() => setSelectedPlanType(planType.value)}
                className={`btn ${selectedPlanType === planType.value ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "6px 10px" }}
              >
                {PROJECT_PLAN_TYPE_LABELS[planType.value] || planType.label}
              </button>
            ))}
          </div>
          <div style={{ minWidth: 240, maxWidth: 360, flex: "1 1 260px", position: "relative" }}>
            <Icon name="search" size={14} />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="查询节点、类型、状态、负责人、说明、链接"
              style={{ ...INPUT_STYLE, paddingLeft: 30 }}
            />
          </div>
        </div>
      </div>

      {milestoneActionError && (
        <div className="feedback-note feedback-note--error" style={{ marginBottom: 12 }}>
          {milestoneActionError}
        </div>
      )}

      {milestonesLoading ? (
        <div className="card empty-state">
          <p>加载中...</p>
        </div>
      ) : milestonesError && milestones.length === 0 ? (
        <div className="card empty-state">
          <p>项目里程碑加载失败</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-secondary" onClick={() => void fetchMilestones()}>
              重试
            </button>
          </div>
        </div>
      ) : milestones.length === 0 && !showMilestoneCreateForm ? (
        <div className="card empty-state">
          <p>可补充下一关键节点、目标日期和负责人，便于判断项目节奏。</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1180, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 52, textAlign: "center" }}>风险</th>
                <th style={TABLE_HEAD_CELL_STYLE}>节点名称</th>
                <th style={TABLE_HEAD_CELL_STYLE}>计划类型</th>
                <th style={TABLE_HEAD_CELL_STYLE}>状态</th>
                <th style={TABLE_HEAD_CELL_STYLE}>目标日期</th>
                <th style={TABLE_HEAD_CELL_STYLE}>实际日期</th>
                <th style={TABLE_HEAD_CELL_STYLE}>负责人</th>
                <th style={TABLE_HEAD_CELL_STYLE}>说明</th>
                <th style={TABLE_HEAD_CELL_STYLE}>链接</th>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 82 }}>排序</th>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 132 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {showMilestoneCreateForm && (
                <tr>
                  <td style={{ ...TABLE_CELL_STYLE, textAlign: "center", color: "var(--text-tertiary)" }}>新</td>
                  <MilestoneFormCells
                    form={milestoneCreateForm}
                    setForm={setMilestoneCreateForm}
                    saving={milestoneCreateSaving}
                    error={milestoneCreateError}
                    onSave={() => void handleMilestoneCreateSubmit()}
                    onCancel={closeMilestoneCreateForm}
                  />
                </tr>
              )}

              {displayedMilestones.length === 0 && !showMilestoneCreateForm ? (
                <tr>
                  <td colSpan={11} style={{ padding: 22, textAlign: "center", color: "var(--text-secondary)" }}>
                    当前筛选/查询条件下暂无项目里程碑
                  </td>
                </tr>
              ) : (
                displayedMilestones.map((milestone) => {
                  const isEditingMilestone = editingMilestoneId === milestone.id;
                  const isDeletingMilestone = deletingMilestoneId === milestone.id;
                  const isRiskMilestone = isMilestoneRisk(milestone, today);

                  if (isEditingMilestone) {
                    return (
                      <tr key={milestone.id} style={{ background: "var(--bg-secondary)" }}>
                        <td style={{ ...TABLE_CELL_STYLE, textAlign: "center" }}>
                          <MilestoneStatusMark milestone={milestone} today={today} />
                        </td>
                        <MilestoneFormCells
                          form={milestoneEditForm}
                          setForm={setMilestoneEditForm}
                          saving={milestoneEditSaving}
                          error={milestoneEditError}
                          onSave={() => void handleMilestoneEditSubmit(milestone.id)}
                          onCancel={closeMilestoneEditForm}
                        />
                      </tr>
                    );
                  }

                  return (
                    <tr key={milestone.id}>
                      <td style={{ ...TABLE_CELL_STYLE, textAlign: "center" }}>
                        <MilestoneStatusMark milestone={milestone} today={today} />
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, fontWeight: 650, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {milestone.title}
                        {isRiskMilestone && <span style={{ marginLeft: 6, color: "var(--accent-red)", fontSize: 12 }}>需关注</span>}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {PROJECT_PLAN_TYPE_LABELS[milestone.planType || "milestone"] || PROJECT_PLAN_TYPE_LABELS.milestone}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {PROJECT_MILESTONE_STATUS_LABELS[milestone.status] || milestone.status}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: isRiskMilestone ? "var(--accent-red)" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {milestone.targetDate ? formatDate(milestone.targetDate) : "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {milestone.actualDate ? formatDate(milestone.actualDate) : "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {milestone.owner || "-"}
                      </td>
                      <td
                        style={{
                          ...TABLE_CELL_STYLE,
                          color: milestone.description ? "var(--text-secondary)" : "var(--text-tertiary)",
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={milestone.description || ""}
                      >
                        {milestone.description || "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, whiteSpace: "nowrap" }}>
                        {milestone.sourceUrl ? (
                          <a href={milestone.sourceUrl} target="_blank" rel="noopener noreferrer" className="project-milestone-card__link">
                            打开
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>-</span>
                        )}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                        {milestone.sortOrder}
                      </td>
                      <td style={ACTION_CELL_STYLE}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openMilestoneEditForm(milestone)}
                            className="btn btn-secondary"
                            disabled={isDeletingMilestone || milestoneEditSaving}
                            style={{ padding: "6px 9px" }}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMilestoneDelete(milestone.id)}
                            className="btn btn-secondary"
                            disabled={isDeletingMilestone}
                            style={{ padding: "6px 9px", color: "var(--accent-red)" }}
                          >
                            {isDeletingMilestone ? "删除中" : "删除"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
