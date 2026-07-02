"use client";

import type { Project } from "@/lib/types";

type ProjectOverviewSectionProps = {
  project: Pick<
    Project,
    "owner" | "pm" | "startDate" | "targetDate" | "releaseDate" | "currentSummary" | "nextMilestone" | "nextAction"
  >;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ProjectOverviewSection({ project }: ProjectOverviewSectionProps) {
  const currentSummary = project.currentSummary ?? "";
  const nextMilestone = project.nextMilestone ?? "";
  const nextAction = project.nextAction ?? "";
  const hasCurrentSummary = Boolean(currentSummary.trim());
  const hasNextMilestone = Boolean(nextMilestone.trim());
  const hasNextAction = Boolean(nextAction.trim());
  const overviewFieldsEmpty = !hasCurrentSummary && !hasNextMilestone && !hasNextAction;
  const hasMeta = Boolean(project.owner || project.pm || project.startDate || project.targetDate || project.releaseDate);

  return (
    <section className="cockpit-section">
      <div className="dashboard-section-title">
        <div>
          <span className="section-eyebrow">OVERVIEW</span>
          <h2>项目概览</h2>
        </div>
      </div>

      <div className="card entity-card entity-card--compact project-overview-card" style={{ padding: 20 }}>
        {overviewFieldsEmpty ? (
          <div style={{ color: "var(--text-tertiary)", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            可补充当前摘要、下一里程碑和下一步动作，方便打开项目时快速判断现状。
          </div>
        ) : (
          <div className="project-overview-grid">
            <div className="project-overview-panel">
              <div style={{ marginBottom: 6, color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                当前项目摘要
              </div>
              <div
                className={hasCurrentSummary ? "entity-card-summary-full" : ""}
                style={{
                  color: hasCurrentSummary ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontSize: 15,
                  lineHeight: 1.72,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {hasCurrentSummary ? currentSummary : "可补充当前摘要，便于快速了解项目现状。"}
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <div className="project-overview-panel">
                <div style={{ marginBottom: 6, color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  下一步动作
                </div>
                <div
                  style={{
                    color: hasNextAction ? "var(--text-primary)" : "var(--text-tertiary)",
                    fontSize: 14,
                    fontWeight: hasNextAction ? 650 : 400,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {hasNextAction ? nextAction : "可补充下一步动作，便于明确近期推进重点。"}
                </div>
              </div>

              <div className="project-overview-panel">
                <div style={{ marginBottom: 6, color: "var(--text-tertiary)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  下一里程碑
                </div>
                <div
                  style={{
                    color: hasNextMilestone ? "var(--text-primary)" : "var(--text-tertiary)",
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {hasNextMilestone ? nextMilestone : "可补充下一里程碑，便于判断项目节奏。"}
                </div>
              </div>
            </div>
          </div>
        )}

        {hasMeta && (
          <div className="project-meta-grid" style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-primary)" }}>
            {project.owner && (
              <div className="project-meta-item">
                <div className="project-meta-label">负责人</div>
                <div className="project-meta-value">{project.owner}</div>
              </div>
            )}
            {project.pm && (
              <div className="project-meta-item">
                <div className="project-meta-label">PM</div>
                <div className="project-meta-value">{project.pm}</div>
              </div>
            )}
            {project.startDate && (
              <div className="project-meta-item">
                <div className="project-meta-label">开始日期</div>
                <div className="project-meta-value">{formatDate(project.startDate)}</div>
              </div>
            )}
            {project.targetDate && (
              <div className="project-meta-item">
                <div className="project-meta-label">目标日期</div>
                <div className="project-meta-value">{formatDate(project.targetDate)}</div>
              </div>
            )}
            {project.releaseDate && (
              <div className="project-meta-item">
                <div className="project-meta-label">发布日期</div>
                <div className="project-meta-value">{formatDate(project.releaseDate)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
