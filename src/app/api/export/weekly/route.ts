import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalDateString, getWeekRange } from "@/lib/utils";

function getLocalDateStart(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export async function GET() {
  try {
    const { start, end } = getWeekRange();
    const weekStart = getLocalDateStart(start);
    const weekEndExclusive = getLocalDateStart(end);
    weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);

    const nextWeekStartDate = new Date(weekEndExclusive);
    const nextWeekEndDate = new Date(nextWeekStartDate);
    nextWeekEndDate.setDate(nextWeekEndDate.getDate() + 6);
    const nextWeekStart = getLocalDateString(nextWeekStartDate);
    const nextWeekEnd = getLocalDateString(nextWeekEndDate);

    const [newItems, statusChanges, riskChanges, completedItems, nextWeekFocus] =
      await Promise.all([
        prisma.workItem.findMany({
          where: { createdAt: { gte: weekStart, lt: weekEndExclusive } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.workLog.findMany({
          where: {
            workDate: { gte: start, lte: end },
            type: { in: ["update", "blocker", "risk"] },
          },
          include: { item: { select: { id: true, title: true } } },
          orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
        }),
        prisma.workLog.findMany({
          where: {
            workDate: { gte: start, lte: end },
            type: { in: ["blocker", "risk"] },
          },
          include: { item: { select: { id: true, title: true } } },
          orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
        }),
        prisma.workItem.findMany({
          where: { closedAt: { gte: weekStart, lt: weekEndExclusive } },
          orderBy: { closedAt: "desc" },
        }),
        prisma.workItem.findMany({
          where: {
            status: { not: "closed" },
            nextCheckpoint: { gte: nextWeekStart, lte: nextWeekEnd },
          },
          orderBy: [{ nextCheckpoint: "asc" }, { priority: "asc" }],
        }),
      ]);

    return NextResponse.json({
      range: { start, end },
      nextWeekRange: { start: nextWeekStart, end: nextWeekEnd },
      newItems,
      statusChanges,
      riskChanges,
      completedItems,
      nextWeekFocus,
    });
  } catch (error) {
    console.error("Error generating weekly brief:", error);
    return NextResponse.json({ error: "生成周报视图失败" }, { status: 500 });
  }
}
