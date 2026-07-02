"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import {
  HEALTH_LABELS,
  PROJECT_STAGE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "@/lib/constants";
import type { Project } from "@/lib/types";

const HEALTH_TONE: Record<string, string> = {
  green: "success",
  yellow: "warning",
  red: "danger",
  unknown: "neutral",
};

const HEALTH_HEADLINE: Record<string, string> = {
  green: "状态正常",
  yellow: "需要关注",
  red: "存在风险",
  unknown: "状态待确认",
};

type ProjectHeaderSectionProps = {
  project: Pick<Project, "id" | "name" | "code" | "status" | "stage" | "type" | "health">;
};

export default function ProjectHeaderSection({ project }: ProjectHeaderSectionProps) {
  const router = useRouter();
  const actionInFlightRef = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const healthTone = HEALTH_TONE[project.health] || "neutral";
  const healthLabel = HEALTH_LABELS[project.health] || project.health;
  const statusLabel = PROJECT_STATUS_LABELS[project.status] || project.status;
  const stageLabel = project.stage ? PROJECT_STAGE_LABELS[project.stage] || project.stage : "阶段待确认";
  const typeLabel = PROJECT_TYPE_LABELS[project.type] || project.type;

  const readErrorMessage = async (res: Response) => {
    const text = await res.text();
    if (!text) return "删除失败";

    try {
      const data = JSON.parse(text) as { error?: string };
      return data.error || "删除失败";
    } catch {
      return "删除失败";
    }
  };

  const handleDelete = async () => {
    if (actionInFlightRef.current) return;

    const confirmed = window.confirm("确认删除这个项目？关联事项和日志不会被删除，只会解除项目关联。");
    if (!confirmed) return;

    actionInFlightRef.current = true;
    setDeleting(true);
    let shouldRestoreButton = true;

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });

      if (res.ok) {
        shouldRestoreButton = false;
        router.replace("/projects");
        return;
      }

      alert(await readErrorMessage(res));
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("删除失败");
    } finally {
      if (shouldRestoreButton) {
        actionInFlightRef.current = false;
        setDeleting(false);
      }
    }
  };

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: "1 1 420px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Link href="/projects" style={{ color: "var(--text-tertiary)", fontSize: 13 }}>
              <Icon name="arrow-left" size={14} /> 返回列表
            </Link>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4, wordBreak: "break-word" }}>
            {project.name}
            {project.code && <span style={{ fontSize: 14, color: "var(--text-tertiary)", marginLeft: 12 }}>{project.code}</span>}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {HEALTH_HEADLINE[project.health] || healthLabel}
            </strong>
            <span className={`badge badge-${healthTone}`}>
              健康：{healthLabel}
            </span>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
              状态：{statusLabel}
            </span>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
              阶段：{stageLabel}
            </span>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 999, background: "var(--bg-primary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
              类型：{typeLabel}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href={`/projects/${project.id}/snapshot`} className="btn btn-ghost">
            <Icon name="file-text" size={15} />
            项目快照事实包
          </Link>
          <Link href={`/projects/${project.id}/edit`} className="btn btn-secondary">
            <Icon name="edit" size={15} />
            编辑项目
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-secondary"
            disabled={deleting}
            style={{ color: "var(--accent-red)" }}
          >
            {deleting ? (
              "删除中..."
            ) : (
              <>
                <Icon name="trash" size={15} />
                删除项目
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
