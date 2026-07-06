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
  {
    href: "/logs",
    label: "日志事实",
    icon: "file-text",
    note: "回看可支撑汇报的原始日志。",
  },
  {
    href: "/items",
    label: "事项信号",
    icon: "clipboard-list",
    note: "确认风险、阻塞和下一步行动。",
  },
] as const;

const qualityChecks = [
  { label: "事实规模", note: "日志、事项、关闭记录是否足够支撑日报。", icon: "file-text" },
  { label: "风险保留", note: "P0/P1、逾期、风险和阻塞不能被压缩丢失。", icon: "alert-triangle" },
  { label: "待确认项", note: "缺责任人、下一步、项目/模块时先回补事实。", icon: "flag" },
  { label: "边界约束", note: "外部工具只整理表达，不补写事实或生成新结论。", icon: "shield-off" },
];

export default function ReportsPage() {
  return (
    <div className="page-shell auxiliary-page reports-page">
      <header className="command-page-header reports-header">
        <div>
          <span className="section-eyebrow">FACT PACKAGE HUB</span>
          <h1>汇报入口</h1>
          <p>
            这里是 WorkHub 的事实包控制台。先选择事实入口，再做质量检查，最后复制给外部工具整理表达。
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

      <section className="card cockpit-card reports-console-card">
        <div className="cockpit-card-head">
          <div>
            <span className="section-eyebrow">REPORT CONTROL</span>
            <h2>事实包控制台</h2>
          </div>
          <span className="section-live"><i />边界已锁定</span>
        </div>
        <div className="reports-console-grid">
          {qualityChecks.map((check) => (
            <div key={check.label} className="reports-quality-item">
              <span><Icon name={check.icon} size={16} /></span>
              <div>
                <strong>{check.label}</strong>
                <p>{check.note}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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

      <section className="reports-section reports-section-compact">
        <div className="dashboard-section-title">
          <div>
            <span className="section-eyebrow">RECENT CONTEXT</span>
            <h2>回补入口</h2>
          </div>
        </div>

        <div className="card reports-shortcuts-card reports-context-card">
          <div className="reports-shortcuts-row">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="btn btn-secondary">
                <Icon name={link.icon} size={14} />
                {link.label}
              </Link>
            ))}
          </div>
          <p className="reports-shortcuts-note">
            事实缺口优先回到今日视图、日志或事项补齐，再回到这里导出。
          </p>
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
            WorkHub 只提供事实包入口，不在这里生成管理结论。
          </p>
          <p className="reports-boundary-copy">
            复制后的 Markdown 可以交给外部工具继续整理成汇报，但外部工具不能补写事实。先看质量检查，再人工确认缺口，避免把不完整事实直接加工成结论。
          </p>
        </div>
      </section>
    </div>
  );
}
