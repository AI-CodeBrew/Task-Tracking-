"use client";

import TimelineView from "@/components/TimelineView";
import { useProjectData } from "@/lib/project-context";

export default function TimelinePage() {
  const { filteredIssues, project, setActiveIssue } = useProjectData();

  return <TimelineView issues={filteredIssues} projectKey={project.key} onIssueClick={setActiveIssue} />;
}
