import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocalDateString, getTodayRange } from "@/lib/utils";

export async function GET() {
  try {
    const date = getLocalDateString();
    const { start, end } = getTodayRange();

    const [newItems, statusChanges, keyRisks, completedItems, pendingItems] =
      await Promise.all([
        prisma.workItem.findMany({
          where: { createdAt: { gte: start, lt: end } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.workLog.findMany({
          where: {
            workDate: date,
            type: { in: ["update", "blocker", "risk"] },
          },
          include: { item: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.workItem.findMany({
          where: {
            health: { in: ["red", "yellow"] },
            status: { not: "closed" },
          },
          orderBy: [{ health: "asc" }, { priority: "asc" }, { updatedAt: "desc" }],
        }),
        prisma.workItem.findMany({
          where: { closedAt: { gte: start, lt: end } },
          orderBy: { closedAt: "desc" },
        }),
        prisma.workItem.findMany({
          where: { status: "open" },
          orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
        }),
      ]);

    return NextResponse.json({
      date,
      newItems,
      statusChanges,
      keyRisks,
      completedItems,
      pendingItems,
    });
  } catch (error) {
    console.error("Error generating daily brief:", error);
    return NextResponse.json({ error: "生成日报视图失败" }, { status: 500 });
  }
}
