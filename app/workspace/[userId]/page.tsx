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
    <div className="grid"
    style={{
      gridTemplateColumns: "280px 1fr 320px",
      height: "calc(100vh - 48px)",
    }}>
      <aside><WorkspaceSidebar userId={userId} /></aside>
      <main className="pt-10 text-lg text-[var(--muted)]">
        <p>Select a project to see more details...</p>
      </main>
    </div>
  );
}
