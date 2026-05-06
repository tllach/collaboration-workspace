"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth/context";

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

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (autoSignInStarted.current) return;
      autoSignInStarted.current = true;
      void signInAs("brand1@briefed.app", "demo1234").catch(() => {
        autoSignInStarted.current = false;
      });
      return;
    }

    if (!profile) {
      return;
    }

    router.replace(`/workspace/${profile.id}`);
  }, [isLoading, user, profile, router, signInAs]);

  if (isLoading || !user || !profile) {
    return <LoadingScreen />;
  }

  return <LoadingScreen />;
}
