import { type RequestStatus } from "@/types";

export type BrandRequestRow = {
    id: string;
    title: string;
    status: RequestStatus;
    deliverable_type: string | null;
    updated_at: string;
    assigned_designer_id: string | null;
};
  
export type DesignerRequestRow = {
    id: string;
    title: string;
    status: RequestStatus;
    deliverable_type: string | null;
    updated_at: string;
    assigned_designer_id: string | null;
    brand_id: string;
    brand: { full_name: string | null } | null;
};