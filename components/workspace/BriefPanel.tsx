"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import {
  REQUEST_STATUS_COLORS,
  REQUEST_STATUS_LABELS,
  type DesignRequestWithRelations,
  type RequestStatus,
} from "@/types";

const STATUS_CLASS: Record<RequestStatus, string> = {
  pending:
    "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] ring-[var(--status-pending-ring)]",
  in_progress:
    "bg-[var(--status-active-bg)] text-[var(--status-active-text)] ring-[var(--status-active-ring)]",
  completed:
    "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] ring-[var(--status-completed-ring)]",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}


export function BriefPanelSkeleton() {
  return (
    <section className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-3/5 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-[var(--skeleton-pulse)] opacity-60" />
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--skeleton-pulse)] opacity-40" />
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2.5 w-10 animate-pulse rounded bg-[var(--skeleton-pulse)] opacity-50" />
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-full animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
        </div>
      </div>

      <div className="mt-4 h-7 w-24 animate-pulse rounded-full bg-[var(--skeleton-pulse)] opacity-50" />

      <div className="my-5 h-px bg-[var(--color-border-tertiary)]" />

      <div className="h-3.5 w-24 animate-pulse rounded bg-[var(--skeleton-pulse)] opacity-60" />
      <div className="mt-3 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--skeleton-pulse)]" />
        <div className="h-3 w-32 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
      </div>
    </section>
  );
}

export function BriefPanel({ request }: { request: DesignRequestWithRelations }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const statusClass = STATUS_CLASS[request.status];
  const statusColor = REQUEST_STATUS_COLORS[request.status];
  const dueDate = formatDate(request.deadline);
  const createdDate = formatDate(request.created_at);
  const updatedDate = formatDate(request.updated_at);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("design_requests")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspace", request.id] });
    },
  });

  const isAssignedToCurrentDesigner =
    Boolean(profile) &&
    request.assigned_designer_id !== null &&
    request.assigned_designer_id === profile?.id;

  const isAssignedToOtherDesigner =
    profile?.role === "designer" &&
    request.assigned_designer_id !== null &&
    request.assigned_designer_id !== profile.id;

  const showCompleteButton =
    profile?.role === "designer" &&
    isAssignedToCurrentDesigner &&
    request.status !== "completed";
  const isCompleted = request.status === "completed";
  const isMutating = completeMutation.isPending;

  return (
    <section className="themed-scrollbar h-full overflow-y-auto p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[18px] font-medium text-[var(--foreground)]">{request.title}</h2>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusClass}`}
            data-status-color={statusColor}
          >
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
          {dueDate ? (
            <span className="text-xs text-[var(--muted)]">Due {dueDate}</span>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Brief</p>
        <p className="themed-scrollbar mt-2 max-h-[300px] overflow-y-auto whitespace-pre-wrap pr-1 text-[13px] leading-[1.8] text-[var(--foreground)] selection:bg-[var(--role-accent-light)]">
          {request.brief}
        </p>
      </div>

      {request.deliverable_type ? (
        <div className="mt-4">
          <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--foreground)]">
            {request.deliverable_type}
          </span>
        </div>
      ) : null}

      {request.reference_urls?.length ? (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
            References
          </p>
          <ul className="mt-2 space-y-2">
            {request.reference_urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-[var(--role-accent)] hover:underline"
                >
                  <span className="truncate">{url}</span>
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="my-5 h-px bg-[var(--color-border-tertiary)]" />

      {profile?.role === "brand" ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--role-accent)]">
            Your request
          </h3>
          {request.assigned_designer_id ? (
            <div className="mt-3 flex items-center gap-3">
              <p className="text-sm text-[var(--muted)]">Working with one of our designers, chat with them to get started.</p>
            </div>
          ) : (
            <WaitingForDesignerCard />
          )}
          {createdDate ? (
            <p className="mt-5 text-xs text-[var(--muted)]">Submitted {createdDate}</p>
          ) : null}
        </div>
      ) : null}

      {profile?.role === "designer" ? (
        <div>
          <h3 className="text-sm font-semibold text-[var(--role-accent)]">
            Your assignment
          </h3>
          
          {showCompleteButton ? (
            <button
              type="button"
              onClick={() => completeMutation.mutate()}
              disabled={isMutating}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--role-accent)] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {completeMutation.isPending ? "Updating..." : "Mark as completed"}
            </button>
          ) : null}

          {isCompleted ? (
            <div className="mt-4 space-y-2">
              <span className="inline-flex items-center rounded-full bg-[var(--status-completed-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-completed-text)] ring-1 ring-[var(--status-completed-ring)]">
                Completed
              </span>
              {updatedDate ? (
                <p className="text-xs text-[var(--muted)]">Delivered {updatedDate}</p>
              ) : null}
            </div>
          ) : null}

          {isAssignedToOtherDesigner ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              This request is assigned to another designer
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function WaitingForDesignerCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may not be available */
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-dashed border-[var(--border-soft)] bg-[var(--color-background-secondary)] px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--role-accent-light)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--role-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
        <p className="text-[13px] leading-snug text-[var(--foreground)]">
          Waiting for a designer to accept your project.
        </p>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted)]">
        Share your project link to speed things up!
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-[var(--border-soft)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--role-accent)] hover:text-[var(--role-accent)]"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
