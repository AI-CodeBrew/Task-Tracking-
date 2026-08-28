"use client";

import ListView from "@/components/ListView";
import { useProjectData } from "@/lib/project-context";

export default function ListPage() {
  const { filteredIssues, statuses, project, setActiveIssue, selectedIds, toggleSelected, isViewer } =
    useProjectData();

  return (
    <ListView
      issues={filteredIssues}
      statuses={statuses}
      projectKey={project.key}
      onRowClick={setActiveIssue}
      selectedIds={selectedIds}
      onToggleSelect={isViewer ? undefined : toggleSelected}
    />
  );
}
