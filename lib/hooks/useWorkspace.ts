"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { DesignRequestWithRelations, WorkspaceData } from "@/types";

export function useWorkspace(requestId: string | null | undefined) {
  return useQuery<WorkspaceData>({
    queryKey: ["workspace", requestId],
    enabled: Boolean(requestId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!requestId) {
        throw new Error("Missing requestId");
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
        throw new Error("Design request not found or not accessible");
      }

      return {
        request: data as DesignRequestWithRelations,
        messages: [],
      };
    },
    refetchOnWindowFocus: false,
  });
}
