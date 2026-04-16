"use client";

import { useParams } from "next/navigation";

export default function WorkspaceUserPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";
  
  return (
    <div className="grid h-[calc(100vh-48px)] grid-cols-[280px_1fr]">
      <main className="flex items-center justify-center bg-neutral-50 p-6">
        <div className="rounded-lg border border-neutral-200 bg-white px-6 py-5 text-sm text-neutral-700">
          Select a project to start collaborating
        </div>
      </main>
    </div>
  );
}
