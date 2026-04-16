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
    <div className="flex min-h-0 flex-col md:h-[calc(100vh-48px)] md:flex-row">
      <WorkspaceSidebar userId={userId} />
      <main className="flex min-h-0 min-w-0 flex-1 items-start justify-center px-4 pt-6 text-center text-base text-[var(--muted)] md:px-0 md:pt-10 md:text-lg">
        <p>Select a project to see more details...</p>
      </main>
    </div>
  );
}
