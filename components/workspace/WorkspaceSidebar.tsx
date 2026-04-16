"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/lib/auth/context";

import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/types";
import { type DesignerRequestRow } from "@/types/workspace.types";

import { useMyBrandRequestsQuery, useDesignerRequestsQuery } from "@/lib/hooks/useSidebar";

type WorkspaceSidebarProps = {
  userId: string;
};

/** Status chips: colors from globals.css per role (--status-*) */
const STATUS_PILL_CLASS: Record<RequestStatus, string> = {
  pending:
    "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)] ring-1 ring-[var(--status-pending-ring)]",
  in_progress:
    "bg-[var(--status-active-bg)] text-[var(--status-active-text)] ring-1 ring-[var(--status-active-ring)]",
  completed:
    "bg-[var(--status-completed-bg)] text-[var(--status-completed-text)] ring-1 ring-[var(--status-completed-ring)]",
};

/** Status pills for designer "My projects": in_progress / completed emphasized per spec */
const MY_PROJECT_STATUS_CLASS: Partial<Record<RequestStatus, string>> = {
  in_progress: STATUS_PILL_CLASS.in_progress,
  completed: STATUS_PILL_CLASS.completed,
};

function ProjectListSkeleton({ count }: { count: number }) {
  return (
    <ul className="flex flex-col gap-2 px-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--surface-2)] p-3"
        >
          <div className="h-4 w-[80%] rounded bg-[var(--skeleton-pulse)]" />
          <div className="mt-2 h-3 w-16 rounded bg-[var(--skeleton-pulse)] opacity-70" />
          <div className="mt-2 h-3 w-24 rounded bg-[var(--skeleton-pulse)] opacity-45" />
        </li>
      ))}
    </ul>
  );
}

function brandName(brand: DesignerRequestRow["brand"]): string {
  return brand?.full_name?.trim() || "Brand";
}

function SidebarCollapseIcon({ direction }: { direction: "collapse" | "expand" }) {
  /* Panel-style chevrons: expand = show list, collapse = hide list */
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--foreground)]"
      aria-hidden
    >
      {direction === "expand" ? (
        <path d="M9 18V6l6 6-6 6z" />
      ) : (
        <path d="M15 18V6l-6 6 6 6z" />
      )}
    </svg>
  );
}

export function WorkspaceSidebar({ userId }: WorkspaceSidebarProps) {
  const params = useParams<{ userId?: string; requestId?: string }>();
  const activeRequestId = params?.requestId ?? null;
  const projectOpen = Boolean(activeRequestId);
  const { profile, isLoading: authLoading } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** When a project route is open, sidebar starts collapsed; user can expand to see the full list. */
  const [listExpanded, setListExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (!projectOpen) setListExpanded(false);
  }, [projectOpen]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const collapsed = !isMobile && projectOpen && !listExpanded;

  const { data: myRequests, isLoading: myRequestsLoading, error: myRequestsError } = useMyBrandRequestsQuery(userId, authLoading, profile);
  const { data: designerRequests, isLoading: designerRequestsLoading, error: designerRequestsError } = useDesignerRequestsQuery(userId, authLoading, profile);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);


  const { myProjects, availableProjects } = useMemo(() => {
    const rows = designerRequests ?? [];
    return {
      myProjects: rows.filter((r) => r.assigned_designer_id === userId),
      availableProjects: rows.filter((r) => r.assigned_designer_id === null),
    };
  }, [designerRequests, userId]);

  const showBrandChrome = profile?.role === "brand";
  const showDesignerChrome = profile?.role === "designer";

  const headerSubtitle = showBrandChrome
    ? "Your design requests"
    : showDesignerChrome
      ? "Assignments and open briefs"
      : "Workspace navigation";

  return (
    <aside
      className={[
        "relative flex min-h-0 w-full flex-col border-b border-[var(--color-border-tertiary)] bg-[var(--surface)] md:h-full md:shrink-0 md:border-b-0 md:border-r md:transition-[width] md:duration-300 md:ease-out",
        collapsed ? "md:w-[52px] md:overflow-hidden" : "md:w-[240px]",
      ].join(" ")}
      style={{ borderRightWidth: "0.5px" }}
    >
      {collapsed ? (
        <div className="flex h-full min-h-0 flex-col items-center py-3">
          <button
            type="button"
            onClick={() => setListExpanded(true)}
            className="flex size-10 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] text-[var(--foreground)] transition-colors hover:border-[var(--border-accent)] hover:bg-[var(--surface)]"
            title="Show projects"
            aria-label="Show projects"
          >
            <SidebarCollapseIcon direction="expand" />
          </button>
        </div>
      ) : (
        <>
      <header className="shrink-0 border-b border-[var(--border-soft)] px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Projects
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{headerSubtitle}</p>
          </div>
          {projectOpen ? (
            <button
              type="button"
              onClick={() => setListExpanded(false)}
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--muted)] hover:border-[var(--border-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <SidebarCollapseIcon direction="collapse" />
            </button>
          ) : null}
        </div>
      </header>

      <div className="max-h-[42vh] min-h-0 flex-1 overflow-y-auto md:max-h-none">
        {showBrandChrome ? (
          authLoading || myRequestsLoading ? (
            <ProjectListSkeleton count={3} />
          ) : myRequestsError ? (
            <p className="px-4 py-6 text-center text-sm text-red-400">
              Unable to load projects.
            </p>
          ) : (myRequests?.length ?? 0) === 0 ? (
            <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
              No projects yet
            </div>
          ) : (
            <ul className="flex flex-col gap-1 p-2">
              {myRequests?.map((request) => {
                const isActive = activeRequestId === request.id;
                return (
                  <li key={request.id}>
                    <Link
                      href={`/workspace/${userId}/${request.id}`}
                      className={[
                        "block rounded-r-md border-l-2 px-3 py-2.5 transition-colors",
                        isActive
                          ? "border-[var(--role-accent)] bg-[var(--role-accent-light)]"
                          : "border-transparent hover:bg-[var(--surface-2)]",
                      ].join(" ")}
                    >
                      <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
                        {request.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span
                          className={[
                            "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                            STATUS_PILL_CLASS[request.status],
                          ].join(" ")}
                        >
                          {REQUEST_STATUS_LABELS[request.status]}
                        </span>
                      </div>
                      {request.deliverable_type ? (
                        <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
                          {request.deliverable_type}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                        {request.assigned_designer_id
                          ? "Designer assigned"
                          : "Awaiting designer"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )
        ) : showDesignerChrome ? (
          authLoading || designerRequestsLoading ? (
            <ProjectListSkeleton count={4} />
          ) : designerRequestsError ? (
            <p className="px-4 py-6 text-center text-sm text-red-400">
              Unable to load projects.
            </p>
          ) : myProjects.length === 0 && availableProjects.length === 0 ? (
            <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-center text-sm text-[var(--muted)]">
              No projects available right now
            </div>
          ) : (
            <div className="pb-2">
              <section className="px-2 pt-2">
                <h3 className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                  My projects
                </h3>
                {myProjects.length === 0 ? (
                  <p className="px-1 py-3 text-xs text-[var(--muted)]">
                    No active projects
                  </p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {myProjects.map((request) => {
                      const isActive = activeRequestId === request.id;
                      const statusClass =
                        MY_PROJECT_STATUS_CLASS[request.status] ??
                        STATUS_PILL_CLASS[request.status];
                      return (
                        <li key={request.id}>
                          <Link
                            href={`/workspace/${userId}/${request.id}`}
                            className={[
                              "block rounded-r-md border-l-2 px-3 py-2.5 transition-colors",
                              isActive
                                ? "border-[var(--role-accent)] bg-[var(--role-accent-light)]"
                                : "border-transparent hover:bg-[var(--surface-2)]",
                            ].join(" ")}
                          >
                            <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
                              {request.title}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
                              by {brandName(request.brand)}
                            </p>
                            <div className="mt-1.5">
                              <span
                                className={[
                                  "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                                  statusClass,
                                ].join(" ")}
                              >
                                {REQUEST_STATUS_LABELS[request.status]}
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="mt-3 border-t border-[var(--border-soft)] pt-3">
                <div className="flex items-center gap-2 px-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                    Available
                  </h3>
                  <span className="rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--foreground)]">
                    {availableProjects.length}
                  </span>
                </div>
                {availableProjects.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-1 px-1">
                    {availableProjects.map((request) => {
                      const isActive = activeRequestId === request.id;
                      return (
                        <li key={request.id}>
                          <Link
                            href={`/workspace/${userId}/${request.id}`}
                            className={[
                              "block rounded-md border-l-2 px-3 py-2.5 transition-colors",
                              isActive
                                ? "border-[var(--role-accent)] bg-[var(--role-accent-light)]"
                                : "border-transparent bg-[var(--color-background-secondary)] hover:bg-[var(--role-accent-light)]",
                            ].join(" ")}
                          >
                            <p className="truncate text-[13px] font-medium text-[var(--foreground)]">
                              {request.title}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-[var(--muted)]">
                              by {brandName(request.brand)}
                            </p>
                            {request.deliverable_type ? (
                              <p className="mt-1 text-[11px] text-[var(--muted)]">
                                {request.deliverable_type}
                              </p>
                            ) : null}
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span
                                className="size-1.5 shrink-0 rounded-full bg-[var(--role-accent)] ring-1 ring-[var(--border-accent)]"
                                aria-hidden
                              />
                              <span className="text-[11px] text-[var(--muted)]">
                                Available
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            </div>
          )
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-xs text-[var(--muted)]">
            Sign in as a brand or designer to see your project list.
          </div>
        )}
      </div>

      {showBrandChrome ? (
        <footer className="shrink-0 border-t border-[var(--border-soft)] p-3">
          <button
            type="button"
            onClick={() => setToastMessage("Coming soon")}
            className="w-full rounded-lg border border-[var(--border-accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            New request
          </button>
        </footer>
      ) : null}

        </>
      )}

      {toastMessage ? (
        <div
          role="status"
          className="pointer-events-none absolute bottom-[4.5rem] left-1/2 z-10 -translate-x-1/2 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-medium text-[var(--foreground)] shadow-lg"
        >
          {toastMessage}
        </div>
      ) : null}
    </aside>
  );
}
