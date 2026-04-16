"use client";

import { useParams } from "next/navigation";

import { WorkspaceMain } from "@/components/workspace/WorkspaceMain";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";

export default function WorkspaceRequestPage() {
  const params = useParams<{ userId: string; requestId: string }>();
  const userId = params?.userId ?? "";
  const requestId = params?.requestId ?? "";

  return (
    <div className="flex h-[calc(100vh-48px)] min-h-0">
      <WorkspaceSidebar userId={userId} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <WorkspaceMain requestId={requestId} />
      </div>
    </div>
  );
}
