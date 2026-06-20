"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import type { AiAgent } from "@/lib/types";
import {
  TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS, SOURCE_LABELS,
} from "@/lib/constants";

type Mode = "today" | "range";

interface NoteData {
  id: string; title: string; content: string; project: string | null;
  module: string | null; type: string; priority: string; status: string;
  owner: string | null; dueDate: string | null; source: string;
  tags: string | null; createdAt: string;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] };
}

function buildPrompt(notes: NoteData[], mode: Mode, dateStart: string, dateEnd: string) {
  const renderNote = (i: number, n: NoteData) =>
    `### ${i}. ${n.title}
- 类型：${TYPE_LABELS[n.type] || n.type}
- 项目/版本：${n.project || "-"}
- 模块：${n.module || "-"}
- 优先级：${PRIORITY_LABELS[n.priority] || n.priority}
- 状态：${STATUS_LABELS[n.status] || n.status}
- 责任人：${n.owner || "-"}
- 截止时间：${n.dueDate || "-"}
- 标签：${n.tags || "-"}
- 来源：${SOURCE_LABELS[n.source] || n.source}
- 原始内容：${n.content}`;

  const notesMd = notes.map((n, i) => renderNote(i + 1, n)).join("\n\n");

  const isDaily = mode === "today";
  const dateStr = isDaily ? dateStart : `${dateStart} ~ ${dateEnd}`;
  const reportType = isDaily ? "日报" : "周报";

  const structure = isDaily
    ? "今日核心进展、今日完成事项、推进中事项、新增风险、阻塞事项、关键决策、待跟进事项、明日重点"
    : "本周主要进展、本周完成事项、本周关键问题、风险与应对、关键决策、下周计划、需要上级关注";

  return `你是一位手机 OS 软件项目经理的${reportType}撰写助手。

请基于以下 ${dateStr} 的工作记录（共 ${notes.length} 条），生成一份${reportType}。

要求：
1. 不要编造记录中没有的信息，所有结论必须来自下方记录
2. 重点识别：进展、风险、阻塞、决策、待办、需要升级的问题
3. 输出结构：${structure}
4. 语言简洁专业，适合手机 OS 软件项目经理${reportType}
5. 使用 Markdown 格式

---

${notesMd}`;
}

export default function AiPage() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [mode, setMode] = useState<Mode>("today");
  const week = getWeekRange();
  const [startDate, setStartDate] = useState(week.start);
  const [endDate, setEndDate] = useState(week.end);

  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [noteCount, setNoteCount] = useState(0);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/ai-providers").then((r) => r.json()).then((data: AiAgent[]) => {
      const enabled = data.filter((a) => a.enabled);
      setAgents(enabled);
      const def = enabled.find((a) => a.isDefault) || enabled[0];
      if (def) setSelectedAgent(def.id);
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2000); };

  const currentAgent = agents.find((a) => a.id === selectedAgent);

  const handleGenerate = async () => {
    setError(""); setPrompt(""); setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "500" });
      if (mode === "today") {
        const today = new Date().toISOString().split("T")[0];
        params.set("startDate", today);
        params.set("endDate", today);
      } else {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }

      const res = await fetch(`/api/notes?${params.toString()}`);
      if (!res.ok) throw new Error("获取记录失败");
      const { notes } = await res.json();
      setNoteCount(notes.length);

      if (notes.length === 0) {
        setError("所选时间范围内没有记录");
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const p = buildPrompt(notes, mode, mode === "today" ? today : startDate, endDate);
      setPrompt(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    }
    setLoading(false);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => showToast("Prompt 已复制到剪贴板"));
  };

  const handleCopyCommand = () => {
    if (!currentAgent?.command) return;
    // Generate a shell command that creates a temp file and pipes it
    const escaped = prompt.replace(/'/g, "'\\''");
    const cmd = currentAgent.command.includes("{prompt_file}")
      ? `TMPF=$(mktemp /tmp/worklog-prompt-XXXXXX.md) && cat > "$TMPF" << 'WORKLOG_PROMPT_EOF'\n${prompt}\nWORKLOG_PROMPT_EOF\n${currentAgent.command.replace("{prompt_file}", '"$TMPF"')}`
      : `echo '${escaped}' | ${currentAgent.command}`;
    navigator.clipboard.writeText(cmd).then(() => showToast("CLI 命令已复制"));
  };

  const handleSelectAll = () => {
    if (promptRef.current) {
      promptRef.current.select();
      promptRef.current.focus();
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>AI 助手</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>
            生成 prompt，复制到本机 AI 工具中运行
          </p>
        </div>
        <Link href="/ai/settings" className="btn btn-ghost">
          <Icon name="settings" size={15} /> 管理 Agent
        </Link>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Agent selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="cpu" size={14} /> 目标 Agent
            </label>
            {agents.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                还没有配置 Agent。
                <Link href="/ai/settings" style={{ color: "var(--accent-blue)", textDecoration: "none" }}> 去添加 →</Link>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="input" style={{ maxWidth: 350 }}>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} {a.isDefault ? "★" : ""} {a.command ? "" : "(纯复制)"}
                    </option>
                  ))}
                </select>
                {currentAgent && (
                  <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                    {currentAgent.description}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mode */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>报告类型</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMode("today")} className={`btn btn-sm ${mode === "today" ? "btn-primary" : "btn-ghost"}`}>
                日报
              </button>
              <button onClick={() => setMode("range")} className={`btn btn-sm ${mode === "range" ? "btn-primary" : "btn-ghost"}`}>
                周报 / 自定义
              </button>
            </div>
          </div>

          {mode === "range" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" style={{ maxWidth: 180 }} />
              <span style={{ color: "var(--text-tertiary)" }}>~</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" style={{ maxWidth: 180 }} />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-purple btn-lg"
            style={{ alignSelf: "flex-start", opacity: loading ? 0.6 : 1 }}
          >
            <Icon name="sparkles" size={16} />
            {loading ? "生成中..." : "生成 Prompt"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--accent-red-light)", color: "var(--accent-red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Generated Prompt */}
      {prompt && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
              基于 <strong style={{ color: "var(--text-secondary)" }}>{noteCount}</strong> 条记录生成
              {currentAgent && <> · 目标: <strong style={{ color: "var(--text-secondary)" }}>{currentAgent.label}</strong></>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={handleSelectAll} className="btn btn-ghost btn-sm">
                <Icon name="file-text" size={14} /> 全选
              </button>
              <button onClick={handleCopyPrompt} className="btn btn-primary btn-sm">
                <Icon name="copy" size={14} /> 复制 Prompt
              </button>
              {currentAgent?.command && (
                <button onClick={handleCopyCommand} className="btn btn-purple btn-sm">
                  <Icon name="zap" size={14} /> 复制 CLI 命令
                </button>
              )}
            </div>
          </div>

          {/* CLI hint */}
          {currentAgent?.command && (
            <div style={{
              padding: "10px 16px",
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border-primary)",
              fontSize: 12, color: "var(--text-secondary)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="zap" size={13} />
              <span>点击「复制 CLI 命令」后，在终端中粘贴运行即可</span>
              <code style={{
                marginLeft: "auto", padding: "2px 6px", borderRadius: 3,
                background: "var(--bg-secondary)", fontFamily: "monospace", fontSize: 11,
              }}>
                {currentAgent.command}
              </code>
            </div>
          )}

          {!currentAgent?.command && (
            <div style={{
              padding: "10px 16px",
              background: "var(--accent-blue-light)",
              borderBottom: "1px solid var(--border-primary)",
              fontSize: 12, color: "var(--accent-blue)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="copy" size={13} />
              <span>纯复制模式 — 点击「复制 Prompt」后手动粘贴到 {currentAgent?.label || "AI 工具"} 中</span>
            </div>
          )}

          <div style={{ padding: 16 }}>
            <textarea
              ref={promptRef}
              value={prompt}
              readOnly
              style={{
                width: "100%", minHeight: 400, padding: 12, border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-md)", fontSize: 13, lineHeight: 1.7,
                background: "var(--bg-primary)", color: "var(--text-primary)",
                fontFamily: "monospace", resize: "vertical", outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  );
}
