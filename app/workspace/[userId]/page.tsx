"use client";

import { redirect } from "next/navigation";

import { useAuth } from "@/lib/auth/context";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";

type WorkspaceUserPageProps = {
  params: { userId: string };
};

export default function WorkspaceUserPage({
  params,
}: WorkspaceUserPageProps) {
  const { userId } = params;

  const { profile } = useAuth();

  if (!profile || profile.id !== userId) {
    redirect("/");
  }

  return (
    <div className="flex h-[calc(100vh-48px)] min-h-0">
      <WorkspaceSidebar userId={userId} />
      <main className="flex min-h-0 min-w-0 flex-1 items-start justify-center pt-10 text-lg text-[var(--muted)]">
        <p>Select a project to see more details...</p>
      </main>
    </div>
  );
}
