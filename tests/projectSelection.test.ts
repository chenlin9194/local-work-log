import { describe, expect, it } from "vitest";
import { resolveItemProjectInheritance, resolveProjectSelection } from "@/lib/projectSelection";

describe("project selection state", () => {
  const projects = [
    { id: "project-1", name: "项目 A" },
    { id: "project-2", name: "项目 B" },
  ];

  it("clears both relation id and legacy name when the project is cleared", () => {
    expect(resolveProjectSelection("", projects)).toEqual({ projectId: "", project: "" });
  });

  it("keeps the selected project id and canonical name together", () => {
    expect(resolveProjectSelection("project-2", projects)).toEqual({ projectId: "project-2", project: "项目 B" });
  });

  it("inherits the selected item project when no project is already selected", () => {
    expect(resolveItemProjectInheritance({
      currentProjectId: "",
      selectedItemProjectId: "project-2",
      selectedItemProjectName: "项目 B",
    })).toEqual({ projectId: "project-2", project: "项目 B" });
  });

  it("preserves the existing project when selecting an item", () => {
    expect(resolveItemProjectInheritance({
      currentProjectId: "project-1",
      selectedItemProjectId: "project-2",
      selectedItemProjectName: "项目 B",
    })).toEqual({});
  });
});
