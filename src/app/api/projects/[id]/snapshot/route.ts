import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLocalDateString } from "@/lib/utils";

const HEALTH_GROUPS = ["red", "yellow", "green", "unknown"] as const;

type WorkItemWithLogs = Prisma.WorkItemGetPayload<Prisma.WorkItemDefaultArgs>;
type WorkLogWithItem = Prisma.WorkLogGetPayload<{
  include: { item: { select: { id: true; title: true } } };
}>;

function buildSnapshot(items: WorkItemWithLogs[], today: string) {
  const byHealth = Object.fromEntries(
    HEALTH_GROUPS.map((health) => [
      health,
      items.filter((item) => item.health === health),
    ])
  );

  const topRisks = items.filter(
    (item) => item.health === "red" || item.status === "blocked"
  );

  const nextCheckpointItem =
    items
      .filter(
        (item) =>
          item.status !== "closed" &&
          item.nextCheckpoint !== null &&
          item.nextCheckpoint >= today
      )
      .sort((a, b) =>
        (a.nextCheckpoint as string).localeCompare(b.nextCheckpoint as string)
      )[0] ?? null;

  return { byHealth, topRisks, nextCheckpointItem };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const today = getLocalDateString();

    // Try to find real Project first
    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    let items: WorkItemWithLogs[];
    let recentLogs: WorkLogWithItem[];

    if (project) {
      // Found real Project - query by projectId
      [items, recentLogs] = await Promise.all([
        prisma.workItem.findMany({
          where: { projectId: project.id },
          orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        }),
        prisma.workLog.findMany({
          where: {
            OR: [{ projectId: project.id }, { item: { projectId: project.id } }],
          },
          include: { item: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const { byHealth, topRisks, nextCheckpointItem } = buildSnapshot(items, today);

      return NextResponse.json({
        projectId: project.id,
        project,
        projectName: project.name,
        items,
        byHealth,
        topRisks,
        recentLogs,
        nextCheckpointItem,
      });
    }

    // Fallback: query by project string (legacy)
    [items, recentLogs] = await Promise.all([
      prisma.workItem.findMany({
        where: { project: id },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      }),
      prisma.workLog.findMany({
        where: {
          OR: [{ project: id }, { item: { project: id } }],
        },
        include: { item: { select: { id: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const { byHealth, topRisks, nextCheckpointItem } = buildSnapshot(items, today);

    return NextResponse.json({
      projectId: id,
      items,
      byHealth,
      topRisks,
      recentLogs,
      nextCheckpointItem,
    });
  } catch (error) {
    console.error("Error generating project snapshot:", error);
    return NextResponse.json({ error: "生成项目快照失败" }, { status: 500 });
  }
}
