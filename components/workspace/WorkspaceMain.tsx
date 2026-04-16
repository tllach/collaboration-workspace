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

function ChatSkeleton() {
  const widths = ["72%", "55%", "80%", "45%", "65%", "58%"];
  const alignRight = [false, true, false, true, false, true];
  return (
    <div className="flex h-full flex-col p-4">
      <div className="border-b border-[var(--color-border-tertiary)] pb-3">
        <div className="h-4 w-16 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
        <div className="mt-2 h-3 w-40 animate-pulse rounded bg-[var(--skeleton-pulse)] opacity-60" />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-3 overflow-hidden rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--surface-2)] p-3">
        {widths.map((w, i) => (
          <div
            key={i}
            className={`flex ${alignRight[i] ? "justify-end" : "justify-start"}`}
          >
            <div
              className="h-10 animate-pulse rounded-lg bg-[var(--skeleton-pulse)]"
              style={{ width: w, animationDelay: `${i * 120}ms` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div className="h-[52px] flex-1 animate-pulse rounded-lg bg-[var(--skeleton-pulse)] opacity-40" />
        <div className="h-9 w-16 animate-pulse rounded-lg bg-[var(--skeleton-pulse)] opacity-40" />
      </div>
    </div>
  );
}

function AIPanelSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b border-[var(--color-border-tertiary)] px-4">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
      </div>
      <div className="flex shrink-0 gap-1.5 border-b border-[var(--color-border-tertiary)] px-4 py-2">
        {[56, 72, 48].map((w, i) => (
          <div
            key={i}
            className="h-6 animate-pulse rounded-full bg-[var(--skeleton-pulse)] opacity-50"
            style={{ width: w }}
          />
        ))}
      </div>
      <div className="flex-1 px-4 py-3">
        <div className="space-y-2 rounded-lg border border-[var(--border-soft)] bg-[var(--color-background-secondary)] p-4">
          <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-full animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
        </div>
      </div>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 md:[grid-template-columns:280px_minmax(0,1fr)] xl:[grid-template-columns:280px_minmax(0,1fr)_320px]">
      <aside className="workspace-panel h-auto border-[var(--color-border-tertiary)] bg-[var(--surface)] md:h-full">
        <BriefPanelSkeleton />
      </aside>
      <main className="workspace-panel h-auto min-w-0 bg-[var(--surface)] md:h-full">
        <ChatSkeleton />
      </main>
      <aside className="workspace-panel-last h-auto bg-[var(--surface)] md:h-full">
        <AIPanelSkeleton />
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
