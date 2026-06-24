import { revalidatePath } from "next/cache";

export function revalidateWorkHubPaths(options?: { itemId?: string; logId?: string; projectId?: string }) {
  revalidatePath("/");
  revalidatePath("/today");
  revalidatePath("/items");
  revalidatePath("/logs");
  revalidatePath("/stats");
  revalidatePath("/projects");
  revalidatePath("/export/today");
  revalidatePath("/export/range");

  if (options?.itemId) {
    revalidatePath(`/items/${options.itemId}`);
  }

  if (options?.logId) {
    revalidatePath(`/logs/${options.logId}`);
  }

  if (options?.projectId) {
    revalidatePath(`/projects/${options.projectId}`);
  }
}
