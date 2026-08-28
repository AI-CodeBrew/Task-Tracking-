"use client";

import Board from "@/components/Board";
import { useProjectData } from "@/lib/project-context";

export default function BoardPage() {
  const { filteredIssues, statuses, project, attachmentCounts, handleCreate, setActiveIssue, handleMove, isViewer } =
    useProjectData();

  return (
    <Board
      issues={filteredIssues}
      statuses={statuses}
      projectKey={project.key}
      attachmentCounts={attachmentCounts}
      onCreate={isViewer ? () => {} : handleCreate}
      onCardClick={setActiveIssue}
      onMove={handleMove}
      readOnly={isViewer}
    />
  );
}
