import { NextRequest, NextResponse } from "next/server";
import { revalidateWorkHubPaths } from "@/lib/revalidate";
import {
  createWorkLogWithContext,
  isCompositeInputError,
} from "@/lib/recordingTransaction";

export async function POST(request: NextRequest) {
  try {
    const result = await createWorkLogWithContext(await request.json(), { requireItemContext: true });
    revalidateWorkHubPaths({
      itemId: result.item?.id || result.log.itemId || undefined,
      logId: result.log.id,
      projectId: result.log.projectId ?? undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isCompositeInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating work log with context:", error);
    return NextResponse.json({ error: "创建日志失败" }, { status: 500 });
  }
}
