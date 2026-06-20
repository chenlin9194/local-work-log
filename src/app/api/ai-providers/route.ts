import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/ai-providers — list all agents
export async function GET() {
  try {
    const agents = await prisma.aiAgent.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(agents);
  } catch (error) {
    console.error("GET /api/ai-providers error:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// POST /api/ai-providers — create agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.label?.trim()) return NextResponse.json({ error: "名称不能为空" }, { status: 400 });

    // If set as default, unset others
    if (body.isDefault) {
      await prisma.aiAgent.updateMany({ data: { isDefault: false } });
    }

    const agent = await prisma.aiAgent.create({
      data: {
        name: body.name?.trim() || body.label.trim().toLowerCase().replace(/\s+/g, "-"),
        label: body.label.trim(),
        description: body.description?.trim() || "",
        command: body.command?.trim() || "",
        isDefault: body.isDefault || false,
        enabled: body.enabled ?? true,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai-providers error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
