import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type WorkspaceUserLayoutProps = {
  children: React.ReactNode;
  params: {
    userId: string;
  };
};

export default async function WorkspaceUserLayout({
  children,
  params,
}: WorkspaceUserLayoutProps) {
  const { userId } = params;
  const supabase = createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (!profile || profile.id !== userId) {
    redirect("/");
  }

  return <>{children}</>;
}
