import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Profile } from "@/types";
import { type BrandRequestRow, type DesignerRequestRow } from "@/types/workspace.types";



export function useMyBrandRequestsQuery(
  userId: string,
  authLoading: boolean,
  profile: Profile | null,
) {
  return useQuery({
    queryKey: ["my-requests", userId],
    enabled:
      !authLoading && profile?.role === "brand" && Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("design_requests")
        .select(
          "id, title, status, deliverable_type, updated_at, assigned_designer_id",
        )
        .eq("brand_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as BrandRequestRow[];
    },
  });
}

export function useDesignerRequestsQuery(
  userId: string,
  authLoading: boolean,
  profile: Profile | null,
) {
  return useQuery({
    queryKey: ["designer-requests", userId],
    enabled:
      !authLoading && profile?.role === "designer" && Boolean(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("design_requests")
        .select(
          "id, title, status, deliverable_type, updated_at, assigned_designer_id, brand_id, brand:profiles!brand_id(full_name)",
        )
        .or(
          `assigned_designer_id.eq.${userId},assigned_designer_id.is.null`,
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as DesignerRequestRow[];
    },
  });
}