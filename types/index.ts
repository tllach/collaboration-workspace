// ─── Base row types ───────────────────────────────────────────
export type { Database } from "./database.types";
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DesignRequest =
  Database["public"]["Tables"]["design_requests"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type DesignerAssignment =
  Database["public"]["Tables"]["designer_assignments"]["Row"];

// ─── Enum types (from the real DB enums) ─────────────────────
export type RequestStatus = Database["public"]["Enums"]["request_status"];
// Values: 'pending' | 'in_progress' | 'completed'

export type UserRole = Database["public"]["Enums"]["user_role"];
// Values: 'brand' | 'designer'

// ─── Composite / joined types ────────────────────────────────

// design_requests has TWO foreign keys to profiles:
// - brand_id → profiles (the brand who owns the request)
// - assigned_designer_id → profiles | null (the designer assigned, or null)
export type DesignRequestWithRelations = DesignRequest & {
  brand: Profile;
  assigned_designer: Profile | null;
};

// messages has sender_role column built-in (no join needed for role)
// but we join the sender profile for name/avatar
export type MessageWithSender = Message & {
  sender: Profile;
};

// Full workspace data shape
export type WorkspaceData = {
  request: DesignRequestWithRelations;
  messages: MessageWithSender[];
};



// ─── Insert helpers ──────────────────────────────────────────
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type DesignRequestUpdate =
  Database["public"]["Tables"]["design_requests"]["Update"];
export type DesignerAssignmentInsert =
  Database["public"]["Tables"]["designer_assignments"]["Insert"];

// ─── Status helpers ──────────────────────────────────────────
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "amber",
  in_progress: "blue",
  completed: "green",
};
