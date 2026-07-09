"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  PROJECT_STAGES,
  HEALTH_OPTIONS,
} from "@/lib/constants";

const EMPTY_PROJECT_FORM = {
  name: "",
  code: "",
  description: "",
  type: "project",
  status: "active",
  stage: "",
  health: "unknown",
  owner: "",
  pm: "",
  startDate: "",
  targetDate: "",
  releaseDate: "",
  currentSummary: "",
  nextMilestone: "",
  nextAction: "",
  sourceSystem: "",
  sourceId: "",
  sourceUrl: "",
  tags: "",
};

type ProjectFormState = typeof EMPTY_PROJECT_FORM;
type ProjectFormField = keyof ProjectFormState;

const PROJECT_FORM_FIELDS = Object.keys(EMPTY_PROJECT_FORM) as ProjectFormField[];

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const submittingRef = useRef(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);
  const [initialForm, setInitialForm] = useState<ProjectFormState>(EMPTY_PROJECT_FORM);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        const nextForm = {
          name: data.name || "",
          code: data.code || "",
          description: data.description || "",
          type: data.type || "project",
          status: data.status || "active",
          stage: data.stage || "",
          health: data.health || "unknown",
          owner: data.owner || "",
          pm: data.pm || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
          targetDate: data.targetDate ? new Date(data.targetDate).toISOString().split("T")[0] : "",
          releaseDate: data.releaseDate ? new Date(data.releaseDate).toISOString().split("T")[0] : "",
          currentSummary: data.currentSummary || "",
          nextMilestone: data.nextMilestone || "",
          nextAction: data.nextAction || "",
          sourceSystem: data.sourceSystem || "",
          sourceId: data.sourceId || "",
          sourceUrl: data.sourceUrl || "",
          tags: data.tags || "",
        };
        setForm(nextForm);
        setInitialForm(nextForm);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const changedFields = useMemo(
    () => PROJECT_FORM_FIELDS.filter((field) => form[field] !== initialForm[field]),
    [form, initialForm]
  );
  const hasUnsavedChanges = changedFields.length > 0;
  const getFieldClassName = (field: ProjectFormField) =>
    `form-field-control${form[field] !== initialForm[field] ? " project-edit-dirty-control" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form.name.trim()) {
      alert("项目名称不能为空");
      return;
    }

    submittingRef.current = true;
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true;
      submitButtonRef.current.textContent = "保存中...";
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setInitialForm(form);
        window.location.assign(`/projects/${id}`);
        return;
      }

      const error = await res.json().catch(() => null);
      alert(error?.error || "更新失败");
      submittingRef.current = false;
      if (submitButtonRef.current) {
        submitButtonRef.current.disabled = false;
        submitButtonRef.current.textContent = hasUnsavedChanges ? "保存未保存修改" : "保存修改";
      }
      setLoading(false);
    } catch (error) {
      console.error("Error updating project:", error);
      alert("更新失败");
      submittingRef.current = false;
      if (submitButtonRef.current) {
        submitButtonRef.current.disabled = false;
        submitButtonRef.current.textContent = hasUnsavedChanges ? "保存未保存修改" : "保存修改";
      }
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-shell">
        <div className="card empty-state"><p>加载中...</p></div>
      </div>
    );
  }

  return (
    <div className="project-edit-form-page">
      <div className="project-edit-return-row">
        <Link href={`/projects/${id}`} className="detail-back-link">
          <Icon name="arrow-left" size={14} /> 返回详情
        </Link>
      </div>

      <div className="project-edit-title-row">
        <h1 className="project-edit-title">编辑项目</h1>
        <span className={`project-edit-state-chip ${hasUnsavedChanges ? "project-edit-state-chip--dirty" : ""}`}>
          {hasUnsavedChanges ? `有 ${changedFields.length} 项未保存` : "无未保存修改"}
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="card form-card project-edit-card project-command-form-card">
          <div className="command-form-stack">
            <section className="project-edit-section project-edit-section--identity">
              <div className="project-edit-section-head">
                <span className="section-eyebrow">IDENTITY</span>
                <h2>核心身份</h2>
              </div>
              <div className="project-form-grid-name project-edit-block project-edit-block-name">
                <div>
                  <label className="form-field-label">项目名称 *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={getFieldClassName("name")} />
                </div>
                <div>
                  <label className="form-field-label">项目缩写/编号</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={getFieldClassName("code")} />
                </div>
              </div>
              <div className="project-form-grid-4 project-edit-block project-edit-block-status">
                <div>
                  <label className="form-field-label">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={getFieldClassName("type")}>
                    {PROJECT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-field-label">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={getFieldClassName("status")}>
                    {PROJECT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-field-label">阶段</label>
                  <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={getFieldClassName("stage")}>
                    <option value="">选择阶段</option>
                    {PROJECT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-field-label">健康度</label>
                  <select value={form.health} onChange={(e) => setForm({ ...form, health: e.target.value })} className={getFieldClassName("health")}>
                    {HEALTH_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="project-edit-section project-edit-section--ownership">
              <div className="project-edit-section-head">
                <span className="section-eyebrow">OWNER & TIME</span>
                <h2>责任与时间</h2>
              </div>
              <div className="project-form-grid-2 project-edit-block project-edit-block-owner">
                <div>
                  <label className="form-field-label">负责人</label>
                  <input type="text" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} className={getFieldClassName("owner")} />
                </div>
                <div>
                  <label className="form-field-label">PM</label>
                  <input type="text" value={form.pm} onChange={(e) => setForm({ ...form, pm: e.target.value })} className={getFieldClassName("pm")} />
                </div>
              </div>
              <div className="project-form-grid-3 project-edit-block project-edit-block-dates">
                <div>
                  <label className="form-field-label">开始日期</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={getFieldClassName("startDate")} />
                </div>
                <div>
                  <label className="form-field-label">目标日期</label>
                  <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className={getFieldClassName("targetDate")} />
                </div>
                <div>
                  <label className="form-field-label">发布日期</label>
                  <input type="date" value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} className={getFieldClassName("releaseDate")} />
                </div>
              </div>
            </section>

            <section className="project-edit-section project-edit-section--anchor">
              <div className="project-edit-section-head">
                <span className="section-eyebrow">NEXT ANCHOR</span>
                <h2>推进锚点</h2>
                <p>优先维护下一个项目级里程碑，详情页会把它作为项目主叙事入口。</p>
              </div>
              <div className="project-edit-block project-edit-block-delivery project-edit-anchor-field">
                <label className="form-field-label">下一个里程碑</label>
                <input type="text" value={form.nextMilestone} onChange={(e) => setForm({ ...form, nextMilestone: e.target.value })} className={getFieldClassName("nextMilestone")} />
              </div>
            </section>

            <section className="project-edit-section project-edit-section--supplement">
              <div className="project-edit-section-head">
                <span className="section-eyebrow">SUPPLEMENT</span>
                <h2>补充信息</h2>
              </div>
              <div className="project-edit-block project-edit-block-description">
                <label className="form-field-label">项目说明 / 版本定位</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${getFieldClassName("description")} form-field-textarea`} />
              </div>
              <div className="project-form-grid-3 project-edit-block project-edit-block-source">
                <div>
                  <label className="form-field-label">来源系统</label>
                  <input type="text" value={form.sourceSystem} onChange={(e) => setForm({ ...form, sourceSystem: e.target.value })} className={getFieldClassName("sourceSystem")} />
                </div>
                <div>
                  <label className="form-field-label">来源编号</label>
                  <input type="text" value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })} className={getFieldClassName("sourceId")} />
                </div>
                <div>
                  <label className="form-field-label">来源链接</label>
                  <input type="text" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className={getFieldClassName("sourceUrl")} />
                </div>
              </div>
              <div className="project-edit-block project-edit-block-tags">
                <label className="form-field-label">标签</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={getFieldClassName("tags")} />
              </div>
              <div className="project-form-grid-2 project-edit-block project-edit-block-summary">
                <div>
                  <label className="form-field-label">补充说明（可选）</label>
                  <textarea value={form.currentSummary} onChange={(e) => setForm({ ...form, currentSummary: e.target.value })} rows={3} className={`${getFieldClassName("currentSummary")} form-field-textarea`} />
                </div>
                <div>
                  <label className="form-field-label">补充推进说明（可选）</label>
                  <textarea value={form.nextAction} onChange={(e) => setForm({ ...form, nextAction: e.target.value })} rows={3} className={`${getFieldClassName("nextAction")} form-field-textarea`} />
                </div>
              </div>
            </section>

            <div className={`field-actions form-footer project-edit-block project-edit-block-actions ${hasUnsavedChanges ? "project-edit-actions--dirty" : ""}`}>
              <span className="project-edit-save-hint">
                {hasUnsavedChanges ? `检测到 ${changedFields.length} 项修改，保存后返回项目详情。` : "当前没有未保存修改。"}
              </span>
              <div className="command-form-actions-main">
                <Link href={`/projects/${id}`} className="btn btn-secondary">
                  取消
                </Link>
                <button ref={submitButtonRef} type="submit" disabled={loading} className={`btn btn-primary ${hasUnsavedChanges ? "project-edit-save-button--dirty" : ""}`}>
                  {loading ? "保存中..." : hasUnsavedChanges ? "保存未保存修改" : "保存修改"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
