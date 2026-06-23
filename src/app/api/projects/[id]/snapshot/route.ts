import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalDateString } from "@/lib/utils";

const HEALTH_GROUPS = ["red", "yellow", "green", "unknown"] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const today = getLocalDateString();

    const [items, recentLogs] = await Promise.all([
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
