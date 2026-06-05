import { api } from "./base";

// ─── Types ───────────────────────────────────────────────────────────
//
// Wire format matches ordering-backend:
//   - DataSubjectRequest          domain.go:31–47
//   - DataExportJob               domain.go:69–86
//   - DataDeletionJob             domain.go:101–118
//   - CreateDataSubjectRequestRequest  handler.go:56–59  ({ request_type, description })
//   - RequestDataExportRequest         handler.go:189–192 ({ format, included_data })
//   - RequestDataDeletionRequest       handler.go:285–290 ({ deletion_type, reason, confirmed, retention_days })
//   - ListDataSubjectRequests → { data, total, limit, offset }  handler.go:141–146
//
// Routes are mounted under /api/v1/{tenant}/compliance/* (handler.go:35–50),
// auth-required (no extra permission gate — any authenticated tenant user acts on
// their OWN data: the service scopes by user.ID from the JWT). The {tenant}
// segment is the org slug, consistent with every other ordering route.

/** DataSubjectRequestType — domain.go:12–17. */
export type DataSubjectRequestType = "export" | "delete" | "access" | "rectify";

/** DataSubjectRequestStatus — domain.go:22–28. */
export type DataSubjectRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

/** DataSubjectRequest — domain.go:31–47. */
export interface DataSubjectRequest {
  id: string;
  tenant_id: string;
  user_id: string;
  request_type: DataSubjectRequestType | string;
  status: DataSubjectRequestStatus | string;
  description?: string;
  result_url?: string;
  error_message?: string;
  processed_by?: string | null;
  notes?: string;
  submitted_at: string;
  processed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** ExportFormat — domain.go:52–55. */
export type ExportFormat = "json" | "csv";

/** DeletionType — domain.go:123–127. */
export type DeletionType = "soft" | "permanent" | "anonymize";

/** DataExportJob — domain.go:69–86. */
export interface DataExportJob {
  id: string;
  tenant_id: string;
  user_id: string;
  format: ExportFormat | string;
  status: string;
  included_data: string[] | null;
  storage_url?: string;
  error_message?: string;
  file_size_bytes?: number | null;
  records_exported?: number | null;
  requested_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** DataDeletionJob — domain.go:101–118. */
export interface DataDeletionJob {
  id: string;
  tenant_id: string;
  user_id: string;
  deletion_type: DeletionType | string;
  status: string;
  reason?: string;
  confirmed: boolean;
  retention_days: number;
  error_message?: string;
  deletion_summary?: Record<string, number> | null;
  requested_at: string;
  scheduled_for?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Request body for POST /compliance/data-subject-requests — handler.go:56–59. */
export interface CreateDataSubjectRequestBody {
  request_type: DataSubjectRequestType;
  description?: string;
}

/** Request body for POST /compliance/data-export — handler.go:189–192. */
export interface RequestDataExportBody {
  format?: ExportFormat;
  included_data?: string[];
}

/** Request body for POST /compliance/data-deletion — handler.go:285–290. */
export interface RequestDataDeletionBody {
  deletion_type?: DeletionType;
  reason?: string;
  confirmed: boolean;
  retention_days?: number;
}

/** Optional filters for GET /compliance/data-subject-requests — handler.go:124–132. */
export interface DataSubjectRequestListParams {
  type?: DataSubjectRequestType;
  status?: DataSubjectRequestStatus;
  limit?: number;
  offset?: number;
}

export interface DataSubjectRequestListResult {
  requests: DataSubjectRequest[];
  total: number;
}

// ─── API Functions ───────────────────────────────────────────────────

/** List the current user's data subject requests. Unwraps the { data, total } envelope. */
export async function listDataSubjectRequests(
  slug: string,
  params: DataSubjectRequestListParams = {},
): Promise<DataSubjectRequestListResult> {
  const res = await api.get(`${slug}/compliance/data-subject-requests`, { params });
  const body = res.data ?? {};
  return {
    requests: body.data ?? [],
    total: body.total ?? 0,
  };
}

/** Create a new data subject request. */
export async function createDataSubjectRequest(
  slug: string,
  body: CreateDataSubjectRequestBody,
): Promise<DataSubjectRequest> {
  const res = await api.post(`${slug}/compliance/data-subject-requests`, body);
  return res.data;
}

/** Request a data export job. */
export async function requestDataExport(
  slug: string,
  body: RequestDataExportBody = {},
): Promise<DataExportJob> {
  const res = await api.post(`${slug}/compliance/data-export`, body);
  return res.data;
}

/** Request a data deletion job. */
export async function requestDataDeletion(
  slug: string,
  body: RequestDataDeletionBody,
): Promise<DataDeletionJob> {
  const res = await api.post(`${slug}/compliance/data-deletion`, body);
  return res.data;
}
