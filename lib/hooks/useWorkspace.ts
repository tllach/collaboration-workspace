"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { DesignRequestWithRelations, WorkspaceData } from "@/types";

export function useWorkspace(requestId: string | null | undefined) {
  return useQuery<WorkspaceData | null>({
    queryKey: ["workspace", requestId],
    enabled: Boolean(requestId),
    staleTime: 30_000,
    queryFn: async (): Promise<WorkspaceData | null> => {
      if (!requestId) {
        return null;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("design_requests")
        .select(
          `
            *,
            brand:profiles!brand_id(*),
            assigned_designer:profiles!assigned_designer_id(*)
          `,
        )
        .eq("id", requestId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return null;
      }

      return {
        request: data as DesignRequestWithRelations,
        messages: [],
      };
    },
    refetchOnWindowFocus: false,
  });
}
