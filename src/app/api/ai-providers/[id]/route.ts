import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/ai-providers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.aiAgent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "不存在" }, { status: 404 });

    if (body.isDefault) {
      await prisma.aiAgent.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }

    const agent = await prisma.aiAgent.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        label: body.label?.trim() ?? existing.label,
        description: body.description?.trim() ?? existing.description,
        command: body.command?.trim() ?? existing.command,
        isDefault: body.isDefault ?? existing.isDefault,
        enabled: body.enabled ?? existing.enabled,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("PUT /api/ai-providers/[id] error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE /api/ai-providers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.aiAgent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ai-providers/[id] error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
