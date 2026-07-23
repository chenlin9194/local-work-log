export interface ProjectSelectionOption {
  id: string;
  name: string;
}

export function resolveProjectSelection(
  projectId: string,
  projects: ProjectSelectionOption[]
) {
  const project = projects.find((candidate) => candidate.id === projectId);
  return {
    projectId: project?.id || "",
    project: project?.name || "",
  };
}

export function resolveItemProjectInheritance({
  currentProjectId,
  selectedItemProjectId,
  selectedItemProjectName,
}: {
  currentProjectId: string;
  selectedItemProjectId?: string | null;
  selectedItemProjectName?: string | null;
}) {
  if (currentProjectId) return {};

  return {
    projectId: selectedItemProjectId || "",
    project: selectedItemProjectName || "",
  };
}
