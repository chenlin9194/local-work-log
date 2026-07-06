"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Icon from "@/components/Icon";
import type { ProjectMember } from "@/lib/types";

type MemberFormState = {
  name: string;
  role: string;
  team: string;
  responsibility: string;
  contact: string;
  isCore: boolean;
  sortOrder: string;
};

const EMPTY_MEMBER_FORM: MemberFormState = {
  name: "",
  role: "",
  team: "",
  responsibility: "",
  contact: "",
  isCore: false,
  sortOrder: "0",
};

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

type ProjectMemberSectionProps = {
  projectId: string;
};

function getMemberSearchText(member: ProjectMember) {
  return [member.name, member.role, member.team, member.responsibility, member.contact]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortMembers(members: ProjectMember[]) {
  return [...members].sort((a, b) => {
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;

    const sortOrderDiff = a.sortOrder - b.sortOrder;
    if (sortOrderDiff !== 0) return sortOrderDiff;

    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function MemberInput({
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

function MemberFormCells({
  form,
  setForm,
  saving,
  error,
  onSave,
  onCancel,
}: {
  form: MemberFormState;
  setForm: Dispatch<SetStateAction<MemberFormState>>;
  saving: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <td style={{ ...TABLE_CELL_STYLE, width: 52, textAlign: "center" }}>
        <input
          type="checkbox"
          checked={form.isCore}
          onChange={(e) => setForm((prev) => ({ ...prev, isCore: e.target.checked }))}
          aria-label="核心成员"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 120 }}>
        <MemberInput
          value={form.name}
          onChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
          placeholder="姓名 *"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 130 }}>
        <MemberInput
          value={form.role}
          onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
          placeholder="SE / 产品 / 测试"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 130 }}>
        <MemberInput
          value={form.team}
          onChange={(value) => setForm((prev) => ({ ...prev, team: value }))}
          placeholder="领域 / 团队"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 240 }}>
        <MemberInput
          value={form.responsibility}
          onChange={(value) => setForm((prev) => ({ ...prev, responsibility: value }))}
          placeholder={error || "职责边界"}
        />
        {error && <div style={{ marginTop: 4, color: "var(--accent-red)", fontSize: 12 }}>{error}</div>}
      </td>
      <td style={{ ...TABLE_CELL_STYLE, minWidth: 150 }}>
        <MemberInput
          value={form.contact}
          onChange={(value) => setForm((prev) => ({ ...prev, contact: value }))}
          placeholder="联系方式"
        />
      </td>
      <td style={{ ...TABLE_CELL_STYLE, width: 88 }}>
        <MemberInput
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

export default function ProjectMemberSection({ projectId }: ProjectMemberSectionProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(false);
  const [memberActionError, setMemberActionError] = useState("");
  const [keyword, setKeyword] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState<MemberFormState>(EMPTY_MEMBER_FORM);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState<MemberFormState>(EMPTY_MEMBER_FORM);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const validateMemberForm = useCallback((form: MemberFormState) => {
    if (!form.name.trim()) return "成员姓名不能为空";
    return "";
  }, []);

  const buildMemberPayload = useCallback((form: MemberFormState) => {
    const sortOrderValue = Number(form.sortOrder);

    return {
      name: form.name.trim(),
      role: form.role,
      team: form.team,
      responsibility: form.responsibility,
      contact: form.contact,
      isCore: form.isCore,
      sortOrder: Number.isFinite(sortOrderValue) ? sortOrderValue : 0,
    };
  }, []);

  const resetCreateForm = useCallback(() => {
    setCreateForm(EMPTY_MEMBER_FORM);
    setCreateError("");
  }, []);

  const resetEditForm = useCallback(() => {
    setEditForm(EMPTY_MEMBER_FORM);
    setEditError("");
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError(false);

      const res = await fetch(`/api/projects/${projectId}/members`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to fetch project members: ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Project members response must be an array");

      setMembers(data);
    } catch (error) {
      console.error("Error fetching project members:", error);
      setMembersError(true);
    } finally {
      setMembersLoading(false);
    }
  }, [projectId]);

  const refreshMembersAfterSave = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, { cache: "no-store" });
      if (!res.ok) return false;

      const data = await res.json();
      if (!Array.isArray(data)) return false;

      setMembers(data);
      setMembersError(false);
      return true;
    } catch (error) {
      console.error("Error refreshing project members after save:", error);
      return false;
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const openCreateForm = () => {
    resetEditForm();
    setEditingMemberId(null);
    setMemberActionError("");
    resetCreateForm();
    setShowCreateForm(true);
  };

  const closeCreateForm = () => {
    resetCreateForm();
    setShowCreateForm(false);
  };

  const openEditForm = (member: ProjectMember) => {
    closeCreateForm();
    setMemberActionError("");
    setEditingMemberId(member.id);
    setEditError("");
    setEditForm({
      name: member.name,
      role: member.role || "",
      team: member.team || "",
      responsibility: member.responsibility || "",
      contact: member.contact || "",
      isCore: member.isCore,
      sortOrder: String(member.sortOrder),
    });
  };

  const closeEditForm = () => {
    resetEditForm();
    setEditingMemberId(null);
  };

  const handleCreateSubmit = async () => {
    if (createSaving) return;

    const validationError = validateMemberForm(createForm);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreateSaving(true);
    setCreateError("");
    setMemberActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildMemberPayload(createForm)),
      });

      if (!res.ok) {
        setCreateError("保存项目成员失败");
        return;
      }

      const createdMember = await res.json();
      setMembers((prev) => sortMembers([createdMember, ...prev]));
      setMembersError(false);
      closeCreateForm();
      await refreshMembersAfterSave();
    } catch (error) {
      console.error("Error creating project member:", error);
      setCreateError("保存项目成员失败");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleEditSubmit = async (memberId: string) => {
    if (editSaving) return;

    const validationError = validateMemberForm(editForm);
    if (validationError) {
      setEditError(validationError);
      return;
    }

    setEditSaving(true);
    setEditError("");
    setMemberActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildMemberPayload(editForm)),
      });

      if (!res.ok) {
        setEditError("更新项目成员失败");
        return;
      }

      const updatedMember = await res.json();
      setMembers((prev) => sortMembers(prev.map((member) => (member.id === memberId ? updatedMember : member))));
      setMembersError(false);
      closeEditForm();
      await refreshMembersAfterSave();
    } catch (error) {
      console.error("Error updating project member:", error);
      setEditError("更新项目成员失败");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    if (deletingMemberId) return;
    if (!confirm("确认删除这个项目成员吗？")) return;

    setDeletingMemberId(memberId);
    setMemberActionError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setMemberActionError("删除项目成员失败");
        return;
      }

      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      if (editingMemberId === memberId) closeEditForm();
      await refreshMembersAfterSave();
    } catch (error) {
      console.error("Error deleting project member:", error);
      setMemberActionError("删除项目成员失败");
    } finally {
      setDeletingMemberId(null);
    }
  };

  const sortedMembers = useMemo(() => sortMembers(members), [members]);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const displayedMembers = useMemo(() => {
    if (!normalizedKeyword) return sortedMembers;
    return sortedMembers.filter((member) => getMemberSearchText(member).includes(normalizedKeyword));
  }, [normalizedKeyword, sortedMembers]);

  const coreMemberCount = members.filter((member) => member.isCore).length;
  const missingResponsibilityCount = members.filter((member) => !member.responsibility?.trim()).length;
  const missingContactCount = members.filter((member) => !member.contact?.trim()).length;

  return (
    <section className="cockpit-section">
      <div className="dashboard-section-title">
        <div>
          <span className="section-eyebrow">MEMBERS</span>
          <h2>项目成员</h2>
        </div>
        {!showCreateForm && (
          <button
            type="button"
            onClick={() => {
              closeEditForm();
              openCreateForm();
            }}
            className="btn btn-secondary"
          >
            <Icon name="plus" size={14} />
            新增成员
          </button>
        )}
      </div>

      <div
        className="card entity-card entity-card--compact"
        style={{ padding: 12, marginBottom: 12, display: "grid", gap: 10 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "var(--text-secondary)", fontSize: 13 }}>
            <span className="entity-pill entity-pill--muted">总数 {members.length}</span>
            <span className="entity-pill entity-pill--success">核心 {coreMemberCount}</span>
            {missingResponsibilityCount > 0 && <span className="entity-pill entity-pill--muted">职责未填 {missingResponsibilityCount}</span>}
            {missingContactCount > 0 && <span className="entity-pill entity-pill--muted">联系方式未填 {missingContactCount}</span>}
          </div>
          <div style={{ minWidth: 240, maxWidth: 360, flex: "1 1 260px", position: "relative" }}>
            <Icon name="search" size={14} />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="查询姓名、角色、团队、职责、联系方式"
              style={{ ...INPUT_STYLE, paddingLeft: 30 }}
            />
          </div>
        </div>
      </div>

      {memberActionError && (
        <div className="feedback-note feedback-note--error" style={{ marginBottom: 12 }}>
          {memberActionError}
        </div>
      )}

      {membersLoading ? (
        <div className="card empty-state empty-state--loading">
          <div className="empty-icon">…</div>
          <strong>正在读取项目成员</strong>
          <p>成员信息会用于快速判断协作关系和责任边界。</p>
        </div>
      ) : membersError && members.length === 0 ? (
        <div className="card empty-state empty-state--error">
          <div className="empty-icon">!</div>
          <strong>项目成员暂时加载失败</strong>
          <p>可以稍后重试，不影响项目其它信息查看。</p>
          <div className="empty-actions">
            <button type="button" className="btn btn-secondary" onClick={() => void fetchMembers()}>
              重试
            </button>
          </div>
        </div>
      ) : members.length === 0 && !showCreateForm ? (
        <div className="card empty-state">
          <div className="empty-icon">👥</div>
          <strong>还没有项目成员</strong>
          <p>可补充 SE、产品、项目、测试、开发等关键角色。</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 52, textAlign: "center" }}>核心</th>
                <th style={TABLE_HEAD_CELL_STYLE}>姓名</th>
                <th style={TABLE_HEAD_CELL_STYLE}>角色</th>
                <th style={TABLE_HEAD_CELL_STYLE}>团队/领域</th>
                <th style={TABLE_HEAD_CELL_STYLE}>职责</th>
                <th style={TABLE_HEAD_CELL_STYLE}>联系方式</th>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 88 }}>排序</th>
                <th style={{ ...TABLE_HEAD_CELL_STYLE, width: 132 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {showCreateForm && (
                <tr>
                  <MemberFormCells
                    form={createForm}
                    setForm={setCreateForm}
                    saving={createSaving}
                    error={createError}
                    onSave={() => void handleCreateSubmit()}
                    onCancel={closeCreateForm}
                  />
                </tr>
              )}

              {displayedMembers.length === 0 && !showCreateForm ? (
                <tr>
                  <td colSpan={8} style={{ padding: 22, textAlign: "center", color: "var(--text-secondary)" }}>
                    当前查询条件下没有成员
                  </td>
                </tr>
              ) : (
                displayedMembers.map((member) => {
                  const isEditing = editingMemberId === member.id;
                  const isDeleting = deletingMemberId === member.id;

                  if (isEditing) {
                    return (
                      <tr key={member.id} style={{ background: "var(--bg-secondary)" }}>
                        <MemberFormCells
                          form={editForm}
                          setForm={setEditForm}
                          saving={editSaving}
                          error={editError}
                          onSave={() => void handleEditSubmit(member.id)}
                          onCancel={closeEditForm}
                        />
                      </tr>
                    );
                  }

                  return (
                    <tr key={member.id}>
                      <td style={{ ...TABLE_CELL_STYLE, textAlign: "center" }}>
                        {member.isCore ? (
                          <span title="核心成员" style={{ color: "var(--accent-green)", fontWeight: 700 }}>★</span>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)" }}>-</span>
                        )}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, fontWeight: 650, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {member.name}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {member.role || "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {member.team || "-"}
                      </td>
                      <td
                        style={{
                          ...TABLE_CELL_STYLE,
                          color: member.responsibility ? "var(--text-secondary)" : "var(--text-tertiary)",
                          maxWidth: 360,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={member.responsibility || ""}
                      >
                        {member.responsibility || "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {member.contact || "-"}
                      </td>
                      <td style={{ ...TABLE_CELL_STYLE, color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                        {member.sortOrder}
                      </td>
                      <td style={ACTION_CELL_STYLE}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => openEditForm(member)}
                            className="btn btn-secondary"
                            disabled={isDeleting || editSaving}
                            style={{ padding: "6px 9px" }}
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(member.id)}
                            className="btn btn-secondary"
                            disabled={isDeleting}
                            style={{ padding: "6px 9px", color: "var(--accent-red)" }}
                          >
                            {isDeleting ? "删除中" : "删除"}
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
