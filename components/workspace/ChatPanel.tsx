"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/context";
import { useRealtimeChat } from "@/lib/hooks/useRealtimeChat";
import type { DesignRequestWithRelations } from "@/types";

type ChatPanelProps = {
  requestId: string;
  request: DesignRequestWithRelations;
};

function counterpartyLabel(request: DesignRequestWithRelations, role: "brand" | "designer") {
  if (role === "brand") {
    if (!request.assigned_designer) return "Awaiting designer";
    const name = request.assigned_designer.full_name ?? "Designer";
    return `with ${name} (Designer)`;
  }

  const brandName = request.brand?.full_name ?? "Brand";
  return `with ${brandName} (Brand)`;
}

export function ChatPanel({ requestId, request }: ChatPanelProps) {
  const { profile } = useAuth();
  const { messages, isLoading, isSending, sendMessage } = useRealtimeChat(requestId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isDesignerBlocked =
    profile?.role === "designer" && request.assigned_designer_id !== profile.id;

  const headerSubtitle = useMemo(() => {
    if (!profile) return "";
    if (profile.role === "brand") return counterpartyLabel(request, "brand");
    if (profile.role === "designer") return counterpartyLabel(request, "designer");
    return "";
  }, [profile, request]);

  useEffect(() => {
    if (isLoading) return;
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [isLoading, messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;
    setDraft("");
    try {
      await sendMessage(text);
    } catch {
      setDraft(text);
    }
  }

  if (isDesignerBlocked) {
    return (
      <section className="flex h-full min-h-0 flex-col p-4">
        <div className="border-b border-[var(--color-border-tertiary)] pb-3">
          <p className="truncate text-[13px] text-[var(--muted)]">{request.title}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{headerSubtitle}</p>
        </div>
        <div className="flex flex-1 items-center justify-center text-center">
          <p className="text-sm text-[var(--muted)]">
            Accept this project to start chatting
            <span className="ml-2 inline-block" aria-hidden>
              →
            </span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col p-4">
      <div className="border-b border-[var(--color-border-tertiary)] pb-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Chat</h2>
        <p className="mt-1 truncate text-[13px] text-[var(--muted)]">{request.title}</p>
        <p className="mt-1 text-xs text-[var(--muted)]">{headerSubtitle}</p>
      </div>

      {isLoading ? (
        <div className="mt-3 flex-1 space-y-2 rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--surface-2)] p-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--skeleton-pulse)]" />
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--surface-2)] p-3"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No messages yet.</p>
          ) : (
            messages.map((message) => {
              const mine = profile?.id === message.sender_id;
              return (
                <div
                  key={message.id}
                  className={[
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    mine
                      ? "ml-auto bg-[var(--role-accent-light)] text-[var(--foreground)]"
                      : "bg-[var(--surface)] text-[var(--foreground)]",
                  ].join(" ")}
                >
                  {!mine ? (
                    <p className="mb-1 text-[11px] text-[var(--muted)]">
                      {message.sender?.full_name ?? "Collaborator"}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
          rows={2}
          placeholder="Write a message…"
          className="min-h-[52px] flex-1 resize-none rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending || !draft.trim()}
          className="rounded-lg bg-[var(--role-accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
