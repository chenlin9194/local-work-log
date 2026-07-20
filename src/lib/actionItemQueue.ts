export type QueueActionItem = {
  dueDate?: string | null;
  status: string;
};

export function groupOpenActionItems<T extends QueueActionItem>(items: T[], today: string) {
  const openItems = items.filter((item) => item.status !== "done");

  return {
    overdue: openItems.filter((item) => Boolean(item.dueDate && item.dueDate < today)),
    dueToday: openItems.filter((item) => item.dueDate === today),
    other: openItems.filter((item) => !item.dueDate || item.dueDate > today),
  };
}
