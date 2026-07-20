import { requireText } from "@/lib/inputValidation";

type ActionItemDoneNoteResult = { value: string | null | undefined; error?: string };

export function resolveActionItemDoneNote(status: string, value: unknown, field = "完成结论"): ActionItemDoneNoteResult {
  if (status !== "done") {
    return { value: typeof value === "string" && value.trim() ? value.trim() : null };
  }

  return requireText(value, field);
}

export function validateActionItemCompletion(
  currentStatus: string,
  nextStatus: string,
  value: unknown,
  field = "完成结论"
): ActionItemDoneNoteResult {
  if (currentStatus === "done" || nextStatus !== "done") {
    return { value: undefined as string | undefined };
  }

  return requireText(value, field);
}
