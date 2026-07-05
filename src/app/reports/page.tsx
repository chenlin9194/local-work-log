import Link from "next/link";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const reportEntrances = [
  {
    href: "/export/today",
    icon: "calendar",
    title: "今日日报事实包",
    subtitle: "导出今天的日志、事项、风险、决策事实，适合直接复制给外部工具继续整理。",
  },
  {
    href: "/export/range",
    icon: "download",
    title: "区间 / 周报事实包",
    subtitle: "按时间范围导出工作记录，适合周报、阶段汇总和回顾场景。",
  },
  {
    href: "/projects",
    icon: "clipboard-list",
    title: "项目快照事实包",
    subtitle: "先进入项目列表，再打开具体项目的快照页查看项目状态、风险和里程碑。",
  },
  {
    href: "/stats",
    icon: "chart",
    title: "统计概览",
    subtitle: "查看事项和日志的整体统计，快速判断当前交付健康度。",
  },
] as const;

const quickLinks = [
  {
    href: "/today",
    label: "今日视图",
    icon: "calendar",
    note: "快速查看今天的工作台。",
  },
] as const;

const workflowSteps = [
  "先选入口：日报、区间、项目快照事实包或统计概览。",
  "把生成的 Markdown 当作事实包，直接复制给外部工具继续整理。",
  "让外部工具负责整理表达，不要让它补写事实或自动下结论。",
  "如果缺少关键信息，先回到 WorkHub 人工确认，再继续汇报。",
];

export default function ReportsPage() {
  return (
    <div className="page-shell auxiliary-page reports-page">
      <header className="command-page-header reports-header">
        <div>
          <span className="section-eyebrow">FACT PACKAGE HUB</span>
          <h1>汇报入口</h1>
          <p>
            这里不是汇报结论生成器，而是 WorkHub 的事实包入口。先把事实整理出来，再交给外部工具组织成日报、周报或管理层汇报；复制前先看质量检查和待确认信息，避免外部工具根据缺失事实自由发挥。
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/export/today" className="btn btn-primary">
            <Icon name="calendar" size={15} />
            今日日报事实包
          </Link>
          <Link href="/projects" className="btn btn-secondary">
            <Icon name="folder" size={15} />
            项目快照事实包
          </Link>
        </div>
      </header>

      <section className="reports-section">
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">ENTRANCES</span>
            <h2>汇报入口卡片</h2>
          </div>
        </div>

        <div className="content-card-grid">
          {reportEntrances.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="card card-hover report-entry-card"
            >
              <div className="report-entry-main">
                <span className="report-entry-icon">
                  <Icon name={entry.icon} size={18} />
                </span>
                <div className="report-entry-copy">
                  <h3>{entry.title}</h3>
                  <p>{entry.subtitle}</p>
                </div>
              </div>

              <div className="report-entry-action">
                <span className="btn btn-secondary report-entry-button">
                  <Icon name="chevron-right" size={14} />
                  打开入口
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="reports-section">
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">WORKFLOW</span>
            <h2>使用流程</h2>
          </div>
        </div>

        <div className="card reports-panel-card">
          <ol className="reports-workflow-list">
            {workflowSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="reports-section">
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">BOUNDARY</span>
            <h2>边界提示</h2>
          </div>
        </div>

        <div className="card reports-boundary-card">
          <p className="reports-boundary-title">
            WorkHub 只提供事实包入口，不在这里生成管理结论。事实包现在包含质量检查和待确认信息。
          </p>
          <p className="reports-boundary-copy">
            复制后的 Markdown 可以交给外部工具继续整理成汇报，但外部工具不能补写事实。先看质量检查，再人工确认缺口，避免把不完整事实直接加工成结论。
          </p>
        </div>
      </section>

      <section className="reports-section reports-section-compact">
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">SHORTCUTS</span>
            <h2>快捷链接</h2>
          </div>
        </div>

        <div className="card reports-shortcuts-card">
          <div className="reports-shortcuts-row">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn btn-secondary">
                <Icon name={link.icon} size={14} />
                {link.label}
              </Link>
            ))}
          </div>
          <p className="reports-shortcuts-note">
            {quickLinks[0].note}
          </p>
        </div>
      </section>
    </div>
  );
}
