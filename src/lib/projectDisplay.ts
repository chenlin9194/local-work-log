export function getProjectDisplayName({
  relationName,
  legacyName,
}: {
  relationName?: string | null;
  legacyName?: string | null;
}) {
  return relationName?.trim() || legacyName?.trim() || "未关联项目";
}
