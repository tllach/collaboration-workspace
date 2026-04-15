"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";

function LoadingScreen() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 text-neutral-600">
      <span
        className="size-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
        aria-hidden
      />
      <p className="text-sm">Loading workspace…</p>
    </div>
  );
}

export default function HomePage() {
  const { user, profile, isLoading, signInAs } = useAuth();
  const router = useRouter();
  const autoSignInStarted = useRef(false);
  const [workspaceResolved, setWorkspaceResolved] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !profile) {
      if (autoSignInStarted.current) return;
      autoSignInStarted.current = true;
      void signInAs("brand1@grayola.io", "grayola123").catch(() => {
        autoSignInStarted.current = false;
      });
      return;
    }

    let cancelled = false;
    setWorkspaceResolved(false);

    void (async () => {
      const supabase = createClient();
      if (profile.role === "brand") {
        const { data } = await supabase
          .from("design_requests")
          .select("id")
          .eq("brand_id", profile.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data?.id) {
          router.replace(`/workspace/${data.id}`);
          return;
        }
      } else {
        const { data } = await supabase
          .from("designer_assignments")
          .select("request_id")
          .eq("designer_id", profile.id)
          .order("assigned_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (data?.request_id) {
          router.replace(`/workspace/${data.request_id}`);
          return;
        }
      }
      if (!cancelled) setWorkspaceResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, profile, router, signInAs]);

  if (isLoading || !user || !profile) {
    return <LoadingScreen />;
  }

  if (!workspaceResolved) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-2 px-4 text-center text-neutral-600">
      <p className="text-sm font-medium text-neutral-800">
        No design request found for this account.
      </p>
      <p className="max-w-md text-sm">
        Seed data includes requests for the demo brands and an assignment for
        the designer — check your Supabase data or switch role in the header.
      </p>
    </div>
  );
}
