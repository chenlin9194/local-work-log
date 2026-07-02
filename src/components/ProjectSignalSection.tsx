"use client";

import Link from "next/link";
import { signalToItemsHref, signalToLogsHref } from "@/lib/signalMap";

type ProjectSignalSectionProps = {
  projectId: string;
  itemCount: number;
  logCount: number;
  p0p1Count: number;
  blockedCount: number;
  redYellowCount: number;
  overdueCount: number;
};

type SignalTone = "neutral" | "danger" | "warning" | "success";

const SIGNAL_TONE_CLASS: Record<SignalTone, string> = {
  neutral: "project-signal-card--neutral",
  danger: "project-signal-card--danger",
  warning: "project-signal-card--warning",
  success: "project-signal-card--success",
};

function SignalCard({
  value,
  label,
  hint,
  tone = "neutral",
  href,
}: {
  value: number;
  label: string;
  hint?: string;
  tone?: SignalTone;
  href?: string;
}) {
  const resolvedTone = value > 0 ? tone : "neutral";
  const cardClassName = [
    "card",
    "entity-card",
    "entity-card--compact",
    "project-signal-card",
    SIGNAL_TONE_CLASS[resolvedTone],
    value === 0 ? "project-signal-card--zero" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="project-signal-card__topline">
        <div className="project-signal-card__label">{label}</div>
        <div className="project-signal-card__value">{value}</div>
      </div>
      {hint && <div className="project-signal-card__hint">{hint}</div>}
    </>
  );

  if (href) {
    return (
      <Link className={cardClassName} href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

export default function ProjectSignalSection({
  projectId,
  itemCount,
  logCount,
  p0p1Count,
  blockedCount,
  redYellowCount,
  overdueCount,
}: ProjectSignalSectionProps) {
  const mustHandleCount = p0p1Count + blockedCount + overdueCount;
  const hasHardSignal = mustHandleCount > 0;
  const hasRiskSignal = redYellowCount > 0;
  const signalTitle = hasHardSignal ? "存在需要优先处理的信号" : hasRiskSignal ? "存在需要关注的风险信号" : "当前没有高优先级风险信号";
  const signalHint = hasHardSignal
    ? `P0/P1 ${p0p1Count} · 阻塞 ${blockedCount} · 逾期 ${overdueCount}`
    : hasRiskSignal
      ? `红黄状态事项 ${redYellowCount}，建议结合关联事项继续确认影响。`
      : "当前没有 P0/P1、阻塞或逾期事项。";

  return (
    <section className="cockpit-section">
      <div className="dashboard-section-title">
        <div>
          <span className="section-eyebrow">SIGNALS</span>
          <h2>状态信号</h2>
        </div>
      </div>

      <div
        className="card entity-card entity-card--compact project-signal-summary"
        style={{
          padding: 16,
          border: hasHardSignal
            ? "1px solid color-mix(in srgb, var(--accent-red) 22%, var(--border-primary))"
            : hasRiskSignal
              ? "1px solid color-mix(in srgb, var(--accent-orange) 20%, var(--border-primary))"
              : "1px solid color-mix(in srgb, var(--accent-green) 18%, var(--border-primary))",
        }}
      >
        <div className="project-signal-summary__title">
          <div className="project-signal-summary__headline">{signalTitle}</div>
          <div className="project-signal-summary__hint">{signalHint}</div>
        </div>
        <div className="project-signal-summary__meta">
          事项 {itemCount} · 日志 {logCount}
        </div>
      </div>

      <div className="project-signal-grid">
        <SignalCard
          value={p0p1Count}
          label="P0 / P1"
          hint="高优先级未关闭事项"
          tone={p0p1Count > 0 ? "danger" : "success"}
          href={signalToItemsHref("p0p1", projectId)}
        />
        <SignalCard
          value={blockedCount}
          label="阻塞"
          hint="推进受阻事项"
          tone={blockedCount > 0 ? "danger" : "success"}
          href={signalToItemsHref("blocked", projectId)}
        />
        <SignalCard
          value={overdueCount}
          label="逾期"
          hint="超过截止日期"
          tone={overdueCount > 0 ? "danger" : "success"}
          href={signalToItemsHref("overdue", projectId)}
        />
        <SignalCard value={redYellowCount} label="红黄" hint="风险或关注状态" tone={redYellowCount > 0 ? "warning" : "success"} />
        <SignalCard value={itemCount} label="事项总数" hint="状态判断来源" />
        <SignalCard value={logCount} label="日志总数" hint="事实支撑记录" />
      </div>

      <div className="project-signal-links">
        <Link href={signalToLogsHref("risk", projectId)} className="project-signal-link" style={{ background: "var(--accent-red-light)", color: "var(--accent-red)" }}>
          Risk Logs
        </Link>
        <Link href={signalToLogsHref("blocker", projectId)} className="project-signal-link" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
          Blocked Logs
        </Link>
      </div>
    </section>
  );
}
