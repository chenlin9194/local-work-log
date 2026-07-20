import { NextRequest, NextResponse } from "next/server";
import { revalidateWorkHubPaths } from "@/lib/revalidate";
import {
  createWorkItemWithActions,
  isCompositeInputError,
} from "@/lib/recordingTransaction";

export async function POST(request: NextRequest) {
  try {
    const result = await createWorkItemWithActions(await request.json());
    revalidateWorkHubPaths({ itemId: result.item.id, projectId: result.item.projectId ?? undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isCompositeInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating work item with action items:", error);
    return NextResponse.json({ error: "创建事项失败" }, { status: 500 });
  }
}
