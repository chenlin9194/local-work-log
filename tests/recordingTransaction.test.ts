import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findProject: vi.fn(),
  findItem: vi.fn(),
  createItem: vi.fn(),
  createLog: vi.fn(),
  createAction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    project: { findUnique: mocks.findProject },
    workItem: { findUnique: mocks.findItem },
  },
}));

import {
  CompositeInputError,
  createWorkItemWithActions,
  createWorkLogWithContext,
} from "@/lib/recordingTransaction";

function useTransactionClient() {
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      workItem: { create: mocks.createItem },
      workLog: { create: mocks.createLog },
      actionItem: { create: mocks.createAction },
    })
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useTransactionClient();
});

describe("atomic recording transactions", () => {
  it("creates an item and every action item through one transaction", async () => {
    mocks.createItem.mockResolvedValue({ id: "item-1", projectId: "project-1" });
    mocks.createAction.mockResolvedValue({ id: "action-1" });
    mocks.findProject.mockResolvedValue({ id: "project-1", name: "项目 A" });

    const result = await createWorkItemWithActions({
      title: "发布跟进",
      projectId: "project-1",
      actionItems: [{ title: "确认版本" }, { title: "更新日报", status: "done", doneNote: "日报已同步" }],
    });

    expect(result.item.id).toBe("item-1");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createItem).toHaveBeenCalledTimes(1);
    expect(mocks.createAction).toHaveBeenCalledTimes(2);
    expect(mocks.createAction).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ workItemId: "item-1", projectId: "project-1", status: "done" }),
    }));
  });

  it("creates a context log and action items linked to its existing item and log", async () => {
    mocks.findItem.mockResolvedValue({ id: "item-1", projectId: "project-1", project: "项目 A" });
    mocks.createLog.mockResolvedValue({ id: "log-1", itemId: "item-1", projectId: "project-1" });
    mocks.createAction.mockResolvedValue({ id: "action-1" });

    const result = await createWorkLogWithContext({
      title: "风险同步",
      content: "等待外部确认",
      itemId: "item-1",
      actionItems: [{ title: "明日跟进" }],
    }, { requireItemContext: true });

    expect(result.log.id).toBe("log-1");
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createLog).toHaveBeenCalledTimes(1);
    expect(mocks.createAction).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ workItemId: "item-1", workLogId: "log-1", projectId: "project-1" }),
    }));
  });

  it("rejects invalid action input before starting a transaction", async () => {
    await expect(createWorkItemWithActions({
      title: "发布跟进",
      actionItems: [{ title: "确认版本", dueDate: "2026-02-30" }],
    })).rejects.toBeInstanceOf(CompositeInputError);

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it("propagates an action write failure so the transaction can roll back all writes", async () => {
    mocks.createItem.mockResolvedValue({ id: "item-1", projectId: null });
    mocks.createAction.mockRejectedValue(new Error("action write failed"));

    await expect(createWorkItemWithActions({
      title: "发布跟进",
      actionItems: [{ title: "确认版本" }],
    })).rejects.toThrow("action write failed");

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.createItem).toHaveBeenCalledTimes(1);
  });
});
