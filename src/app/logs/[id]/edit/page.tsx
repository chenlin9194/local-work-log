"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { WORK_LOG_TYPES, SOURCES, MODULES } from "@/lib/constants";

export default function EditLogPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({
    workDate: "",
    title: "",
    content: "",
    type: "note",
    source: "manual",
    project: "",
    module: "",
    tags: "",
    itemId: "",
    reportable: false,
    sourceUrl: "",
  });

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/logs/${id}`);
      if (res.ok) {
        const log = await res.json();
        setForm({
          workDate: log.workDate || "",
          title: log.title || "",
          content: log.content || "",
          type: log.type || "note",
          source: log.source || "manual",
          project: log.project || "",
          module: log.module || "",
          tags: log.tags || "",
          itemId: log.itemId || "",
          reportable: Boolean(log.reportable),
          sourceUrl: log.sourceUrl || "",
        });
      } else {
        alert("日志不存在");
        router.push("/logs");
      }
    } catch (error) {
      console.error("Error fetching log:", error);
    } finally {
      setFetching(false);
    }
  }, [id, router]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items?pageSize=100");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }, []);

  useEffect(() => {
    fetchLog();
    fetchItems();
  }, [fetchItems, fetchLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.content.trim()) {
      alert("标题和内容不能为空");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        router.refresh();
        router.push(`/logs/${id}`);
      } else {
        const error = await res.json();
        alert(error.error || "保存失败，请重试");
      }
    } catch (error) {
      console.error("Error updating log:", error);
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-shell command-form-page log-entry-page">
        <div className="card form-card command-form-card command-form-message">
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell command-form-page log-entry-page log-edit-evidence-page">
      <header className="command-form-header">
        <Link href={`/logs/${id}`} className="detail-back-link">
          ← 返回日志详情
        </Link>
        <div>
          <span className="section-eyebrow">COMMAND FORM / LOG</span>
          <h1>编辑日志</h1>
          <p>日志是事实证据：记录发生了什么、形成了什么结论，以及后续汇报和追溯需要依赖的上下文。</p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="card form-card command-form-card log-entry-card log-command-form-card">
          <div className="log-edit-layout">
            <main className="log-edit-primary">
              <section className="command-form-section log-form-section-content">
                <div className="command-form-section-header">
                  <h2>事实内容</h2>
                  <p>标题用一句话说明发生了什么；正文记录事实、影响、结论和待跟进点，具体动作请沉淀到行动项。</p>
                </div>

                <div>
                  <label className="form-field-label">标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="一句话说明发生了什么"
                    required
                    className="form-field-control"
                  />
                </div>

                <div>
                  <label className="form-field-label">内容 *</label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="记录事实、影响、结论、待跟进点；具体动作请沉淀到行动项。"
                    rows={12}
                    required
                    className="input log-content-input"
                  />
                </div>
              </section>
            </main>

            <aside className="log-edit-sidebar">
              <section className="command-form-section log-form-section-context">
                <div className="command-form-section-header">
                  <h2>关联上下文</h2>
                  <p>说明这条事实属于哪一天、哪个项目或事项。</p>
                </div>

                <div>
                  <label className="form-field-label">工作日期 *</label>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="form-field-label">关联项目</label>
                  <input
                    type="text"
                    value={form.project}
                    onChange={(e) => setForm({ ...form, project: e.target.value })}
                    className="form-field-control"
                  />
                </div>

                <div>
                  <label className="form-field-label">关联事项</label>
                  <select
                    value={form.itemId}
                    onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                    className="form-field-control"
                  >
                    <option value="">不关联</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="command-form-section log-form-section-taxonomy">
                <div className="command-form-section-header">
                  <h2>分类与汇报</h2>
                  <p>类型决定日志在时间线中的语义：决策是结论，风险/阻塞需要关注，更新是过程记录，关键事实用于重要节点变化。</p>
                </div>

                <div className="field-grid-2">
                  <div>
                    <label className="form-field-label">类型</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="form-field-control"
                    >
                      {WORK_LOG_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-field-label">来源</label>
                    <select
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value })}
                      className="form-field-control"
                    >
                      {SOURCES.map((source) => (
                        <option key={source.value} value={source.value}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-field-label">模块</label>
                  <select
                    value={form.module}
                    onChange={(e) => setForm({ ...form, module: e.target.value })}
                    className="form-field-control"
                  >
                    <option value="">选择模块</option>
                    {MODULES.map((module) => (
                      <option key={module} value={module}>
                        {module}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="field-checkbox log-reportable-check">
                  <input
                    type="checkbox"
                    checked={form.reportable}
                    onChange={(e) => setForm({ ...form, reportable: e.target.checked })}
                  />
                  <span>
                    <strong>可汇报</strong>
                    <small>进入日报、周报或项目汇报素材池。</small>
                  </span>
                </label>

                <div>
                  <label className="form-field-label">标签</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="标签，用逗号分隔"
                    className="form-field-control"
                  />
                </div>
              </section>

              <section className="command-form-section log-form-section-source">
                <div className="command-form-section-header">
                  <h2>来源证据</h2>
                  <p>保留外部证据入口，便于汇报追溯。当前模型仅支持来源链接。</p>
                </div>

                <div>
                  <label className="form-field-label">来源链接</label>
                  <input
                    type="url"
                    value={form.sourceUrl}
                    onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                    placeholder="https://..."
                    className="form-field-control"
                  />
                </div>
              </section>
            </aside>
          </div>

          <div className="command-form-actions log-edit-actions">
            <span className="field-note">保存后会进入日志详情页。</span>
            <div className="command-form-actions-main">
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">
                取消
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "保存中..." : "保存日志"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
