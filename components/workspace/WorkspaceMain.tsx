"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

import { AcceptProjectPanel } from "@/components/workspace/AcceptProjectPanel";
import { AIPanel } from "@/components/workspace/AIPanel";
import { BriefPanel, BriefPanelSkeleton } from "@/components/workspace/BriefPanel";
import { ChatPanel } from "@/components/workspace/ChatPanel";
import { useAuth } from "@/lib/auth/context";
import { useWorkspace } from "@/lib/hooks/useWorkspace";

type WorkspaceMainProps = {
  requestId: string;
};

function WorkspaceSkeleton() {
  return (
    <div
      className="grid h-full min-h-0 w-full grid-cols-1 md:[grid-template-columns:280px_minmax(0,1fr)] xl:[grid-template-columns:280px_minmax(0,1fr)_320px]"
    >
      <aside className="workspace-panel h-auto border-[var(--color-border-tertiary)] bg-[var(--surface)] md:h-full">
        <BriefPanelSkeleton />
      </aside>
      <main className="workspace-panel h-auto min-w-0 bg-[var(--surface)] md:h-full">
        <div className="h-full animate-pulse bg-[var(--skeleton-pulse)] p-4" />
      </main>
      <aside className="workspace-panel-last h-auto bg-[var(--surface)] md:h-full">
        <div className="h-full animate-pulse bg-[var(--skeleton-pulse)] p-4" />
      </aside>
    </div>
  );
}

function DesignerLockedChatPanel() {
  return (
    <section className="flex h-full min-h-0 flex-col items-center justify-center p-6 text-center">
      <p className="text-sm text-[var(--muted)]">
        This project is assigned to another designer. Chat isn&apos;t available
        for this request.
      </p>
    </section>
  );
}

export function WorkspaceMain({ requestId }: WorkspaceMainProps) {
  const params = useParams<{ userId?: string }>();
  const userId = params?.userId ?? "";
  const { profile, isLoading: authLoading } = useAuth();
  const { data, isLoading: isWorkspaceLoading, error, isFetched } = useWorkspace(
    requestId || null,
  );

  const showWorkspaceSkeleton = authLoading || isWorkspaceLoading;

  if (showWorkspaceSkeleton) {
    return <WorkspaceSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-4">
        <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-6 py-5 text-sm text-[var(--foreground)]">
          Select a role above to view this workspace
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center px-4">
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm text-red-200">
          Unable to load workspace data.
        </div>
      </div>
    );
  }

  if (isFetched && data === null) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-[var(--muted)]">
          You don&apos;t have access to this project.
        </p>
        <Link
          href={userId ? `/workspace/${userId}` : "/"}
          className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
        >
          Back
        </Link>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const roleClass =
    profile.role === "brand"
      ? "role-brand"
      : profile.role === "designer"
        ? "role-designer"
        : "";

  const { request } = data;

  let centerPanel: ReactNode;
  if (profile.role === "brand") {
    centerPanel = <ChatPanel key={requestId} requestId={requestId} request={request} />;
  } else if (profile.role === "designer") {
    if (request.assigned_designer_id === profile.id) {
      centerPanel = <ChatPanel key={requestId} requestId={requestId} request={request} />;
    } else if (request.assigned_designer_id === null) {
      centerPanel = (
        <AcceptProjectPanel request={request} userId={userId} />
      );
    } else {
      centerPanel = <DesignerLockedChatPanel />;
    }
  } else {
    centerPanel = <ChatPanel key={requestId} requestId={requestId} request={request} />;
  }

  return (
    <div
      className={`workspace-main ${roleClass} flex h-full min-h-0 min-w-0 flex-col`}
    >
      <div
        className="grid h-full min-h-0 flex-1 grid-cols-1 overflow-y-auto md:[grid-template-columns:280px_minmax(0,1fr)] md:overflow-hidden xl:[grid-template-columns:280px_minmax(0,1fr)_320px]"
      >
        <aside className="workspace-panel h-auto border-[var(--color-border-tertiary)] bg-[var(--surface)] md:h-full">
          <BriefPanel request={request} />
        </aside>
        <main className="workspace-panel h-auto min-w-0 bg-[var(--surface)] md:h-full">
          {centerPanel}
        </main>
        <aside className="workspace-panel-last h-auto bg-[var(--surface)] md:h-full">
          <AIPanel
            key={requestId}
            requestId={requestId}
            requestTitle={request.title}
          />
        </aside>
      </div>
    </div>
  );
}
