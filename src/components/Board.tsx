"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import Column from "@/components/Column";
import { IssueCardContent } from "@/components/IssueCard";
import { createClient } from "@/lib/supabase/client";
import { positionBetween } from "@/lib/position";
import { ISSUE_STATUSES } from "@/lib/types";
import type { Issue, IssueStatus } from "@/lib/types";

export default function Board({
  issues,
  projectKey,
  attachmentCounts,
  onCreate,
  onCardClick,
  onMove,
}: {
  issues: Issue[];
  projectKey: string;
  attachmentCounts: Record<string, number>;
  onCreate: (status: IssueStatus, title: string) => void;
  onCardClick: (issue: Issue) => void;
  onMove: (issueId: string, status: IssueStatus, position: number) => void;
}) {
  const supabase = createClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveIssue(issues.find((i) => i.id === event.active.id) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveIssue(null);
    const { active, over } = event;
    if (!over) return;

    const issueId = active.id as string;
    const overId = over.id as string;
    const current = issues.find((i) => i.id === issueId);
    if (!current) return;

    const overIsColumn = overId.startsWith("column-");
    const targetStatus = overIsColumn
      ? (overId.replace("column-", "") as IssueStatus)
      : issues.find((i) => i.id === overId)?.status;
    if (!targetStatus) return;

    const siblings = issues
      .filter((i) => i.status === targetStatus && i.id !== issueId)
      .sort((a, b) => a.position - b.position);

    let newPosition: number;
    if (overIsColumn) {
      newPosition = positionBetween(siblings[siblings.length - 1]?.position, undefined);
    } else {
      const overIndex = siblings.findIndex((i) => i.id === overId);
      const before = overIndex > 0 ? siblings[overIndex - 1] : undefined;
      const overSibling = overIndex >= 0 ? siblings[overIndex] : undefined;
      newPosition = positionBetween(before?.position, overSibling?.position);
    }

    if (targetStatus === current.status && newPosition === current.position) return;

    onMove(issueId, targetStatus, newPosition);

    const { error } = await supabase
      .from("issues")
      .update({ status: targetStatus, position: newPosition })
      .eq("id", issueId);

    if (error) {
      onMove(issueId, current.status, current.position);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ISSUE_STATUSES.map((s) => (
          <Column
            key={s.value}
            status={s.value}
            label={s.label}
            projectKey={projectKey}
            attachmentCounts={attachmentCounts}
            issues={issues
              .filter((i) => i.status === s.value)
              .sort((a, b) => a.position - b.position)}
            onCardClick={onCardClick}
            onCreate={(title) => onCreate(s.value, title)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeIssue && (
          <IssueCardContent
            issue={activeIssue}
            projectKey={projectKey}
            attachmentCount={attachmentCounts[activeIssue.id] ?? 0}
            dragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
