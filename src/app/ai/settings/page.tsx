"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import type { AiAgent } from "@/lib/types";

const EXAMPLES = [
  {
    label: "Claude Code (WSL)",
    name: "claude-code",
    description: "运行在 WSL 中的 Claude Code CLI",
    command: "cat {prompt_file} | claude --print",
  },
  {
    label: "Codex CLI (WSL)",
    name: "codex-cli",
    description: "运行在 WSL 中的 Codex CLI",
    command: "cat {prompt_file} | codex",
  },
  {
    label: "Codex Desktop App",
    name: "codex-desktop",
    description: "本机 Codex 桌面应用（手动粘贴）",
    command: "",
  },
  {
    label: "Hermes (WSL)",
    name: "hermes",
    description: "运行在 WSL 中的 Hermes",
    command: "cat {prompt_file} | hermes",
  },
];

export default function AiSettingsPage() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "", label: "", description: "", command: "", isDefault: false, enabled: true,
  });

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-providers");
      if (res.ok) setAgents(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const applyExample = (ex: typeof EXAMPLES[number]) => {
    setForm((f) => ({ ...f, name: ex.name, label: ex.label, description: ex.description, command: ex.command }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", label: "", description: "", command: "", isDefault: false, enabled: true });
    setError("");
    setShowForm(true);
  };

  const openEdit = (a: AiAgent) => {
    setEditId(a.id);
    setForm({ name: a.name, label: a.label, description: a.description, command: a.command, isDefault: a.isDefault, enabled: a.enabled });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.label.trim()) { setError("显示名称不能为空"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/ai-providers/${editId}` : "/api/ai-providers";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      showToast(editId ? "已更新" : "已添加");
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/ai-providers/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    showToast("已设为默认");
    fetchAgents();
  };

  const handleToggle = async (a: AiAgent) => {
    await fetch(`/api/ai-providers/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !a.enabled }),
    });
    fetchAgents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此 Agent？")) return;
    await fetch(`/api/ai-providers/${id}`, { method: "DELETE" });
    showToast("已删除");
    fetchAgents();
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>本机 AI Agent 配置</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>
            配置本机安装的 AI 工具，每台机器独立，不随代码同步
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Icon name="plus" size={15} /> 添加 Agent
        </button>
      </div>

      {/* Hint */}
      <div className="card" style={{ padding: 16, background: "var(--accent-blue-light)", border: "1px solid var(--accent-blue)", borderRadius: "var(--radius-md)" }}>
        <div style={{ fontSize: 13, color: "var(--accent-blue)", lineHeight: 1.7 }}>
          <strong>工作流程：</strong>在 AI 助手页生成 prompt → 复制 prompt 文本 或 复制 CLI 命令 → 粘贴到对应工具中运行<br />
          <strong>命令模板：</strong>用 <code style={{ background: "var(--bg-secondary)", padding: "1px 4px", borderRadius: 3 }}>{"{prompt_file}"}</code> 表示 prompt 文件路径，留空则为「纯复制」模式（手动粘贴到桌面应用）
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}

      {/* Agent List */}
      {loading ? (
        <div className="card empty-state">加载中...</div>
      ) : agents.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🤖</div>
          <div style={{ marginBottom: 8 }}>还没有配置本机 Agent</div>
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 16 }}>
            添加你电脑上安装的 Claude Code、Codex、Hermes 等工具
          </div>
          <button onClick={openCreate} className="btn btn-primary">添加第一个 Agent</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agents.map((a) => (
            <div key={a.id} className="card" style={{ padding: 16, opacity: a.enabled ? 1 : 0.5 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{a.label}</span>
                    {a.isDefault && (
                      <span className="badge" style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}>默认</span>
                    )}
                    {!a.enabled && (
                      <span className="badge" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>已禁用</span>
                    )}
                  </div>
                  {a.description && (
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>{a.description}</div>
                  )}
                  {a.command ? (
                    <code style={{
                      display: "inline-block", fontSize: 12, padding: "3px 8px", borderRadius: 4,
                      background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontFamily: "monospace",
                      maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {a.command}
                    </code>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic" }}>纯复制模式（手动粘贴）</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {!a.isDefault && a.enabled && (
                    <button onClick={() => handleSetDefault(a.id)} className="btn btn-ghost btn-sm" title="设为默认">
                      <Icon name="check-circle" size={14} />
                    </button>
                  )}
                  <button onClick={() => handleToggle(a)} className="btn btn-ghost btn-sm" title={a.enabled ? "禁用" : "启用"}>
                    <Icon name={a.enabled ? "zap" : "refresh"} size={14} />
                  </button>
                  <button onClick={() => openEdit(a)} className="btn btn-ghost btn-sm">
                    <Icon name="edit" size={14} />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="btn btn-ghost btn-sm" style={{ color: "var(--accent-red)" }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>
                {editId ? "编辑 Agent" : "添加本机 Agent"}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm"><Icon name="x" size={16} /></button>
            </div>

            {error && (
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--accent-red-light)", color: "var(--accent-red)", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            {/* Quick fill examples */}
            {!editId && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
                  快速填入示例
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {EXAMPLES.map((ex) => (
                    <button key={ex.name} onClick={() => applyExample(ex)} className="btn btn-ghost btn-sm">
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  显示名称 <span style={{ color: "var(--accent-red)" }}>*</span>
                </label>
                <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} className="input" placeholder="如：Claude Code" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  备注说明
                </label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input" placeholder="如：运行在 WSL Ubuntu 中" />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                  CLI 命令模板
                </label>
                <input value={form.command} onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))} className="input" style={{ fontFamily: "monospace" }}
                  placeholder="cat {prompt_file} | claude --print  (留空 = 纯复制模式)" />
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                  <code>{"{prompt_file}"}</code> 会被替换为包含 prompt 内容的临时文件路径。留空表示纯复制模式，你手动粘贴到桌面应用。
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
                设为默认 Agent
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">取消</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? "保存中..." : editId ? "更新" : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
