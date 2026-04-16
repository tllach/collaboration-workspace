"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import type { DesignRequestWithRelations } from "@/types";

type AcceptProjectPanelProps = {
  request: DesignRequestWithRelations;
  userId: string;
};

function briefPreview(brief: string, max = 200): string {
  const trimmed = brief.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}...`;
}

export function AcceptProjectPanel({ request, userId }: AcceptProjectPanelProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Missing profile");

      const { error: updateError } = await supabase
        .from("design_requests")
        .update({
          assigned_designer_id: profile.id,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      const { error: assignmentError } = await supabase
        .from("designer_assignments")
        .insert({
          request_id: request.id,
          designer_id: profile.id,
        });

      if (assignmentError) throw assignmentError;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["workspace", request.id] }),
        queryClient.invalidateQueries({ queryKey: ["designer-requests", userId] }),
      ]);
    },
  });

  return (
    <section className="flex h-full min-h-0 flex-col p-4">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">
        Accept project
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        You haven&apos;t accepted this project yet
      </p>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--border-soft)] bg-[var(--surface-2)] p-3 text-sm leading-relaxed text-[var(--foreground)]">
        {briefPreview(request.brief)}
      </div>

      <button
        type="button"
        onClick={() => acceptMutation.mutate()}
        disabled={acceptMutation.isPending}
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[var(--role-accent)] px-4 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {acceptMutation.isPending ? "Accepting…" : "Accept this project"}
      </button>
    </section>
  );
}
