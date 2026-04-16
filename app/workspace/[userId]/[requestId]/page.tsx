"use client";

import { useParams } from "next/navigation";

import { WorkspaceMain } from "@/components/workspace/WorkspaceMain";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";

export default function WorkspaceRequestPage() {
  const params = useParams<{ userId: string; requestId: string }>();
  const userId = params?.userId ?? "";
  const requestId = params?.requestId ?? "";

  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[260px_1fr]">
      <WorkspaceSidebar userId={userId} />
      <WorkspaceMain requestId={requestId} />
    </div>
  );
}
