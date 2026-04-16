"use client";

import { AIPanel } from "@/components/workspace/AIPanel";
import { BriefPanel, BriefPanelSkeleton } from "@/components/workspace/BriefPanel";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout";
import { useAuth } from "@/lib/auth/context";
import { useWorkspace } from "@/lib/hooks/useWorkspace";

type WorkspaceMainProps = {
  requestId: string;
};

function WorkspaceSkeleton() {
  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[1fr_320px]">
      <div className="border-r border-neutral-200 bg-white">
        <BriefPanelSkeleton />
      </div>
      <div className="animate-pulse bg-neutral-100" />
    </div>
  );
}

export function WorkspaceMain({ requestId }: WorkspaceMainProps) {
  const { profile, isLoading } = useAuth();
  const { data, isLoading: isWorkspaceLoading, error } = useWorkspace(requestId);

  if (isLoading || isWorkspaceLoading) {
    return <WorkspaceSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-5 text-sm text-neutral-700">
          Select a role above to view this workspace
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
          Unable to load workspace data.
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout
      profile={profile}
      leftPanel={<BriefPanel request={data.request} />}
      centerPanel={<ChatPanel />}
      rightPanel={<AIPanel />}
    />
  );
}
