"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateDataSubjectRequest,
  useDataSubjectRequests,
  useRequestDataDeletion,
  useRequestDataExport,
} from "@/hooks/use-compliance";
import type {
  DataSubjectRequest,
  DataSubjectRequestType,
  DeletionType,
} from "@/lib/api/compliance";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, "soft" | "outline"> = {
  completed: "soft",
  pending: "outline",
  processing: "outline",
  failed: "outline",
  cancelled: "outline",
};

function humanize(value: string): string {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Create DSR / export / deletion form ──────────────────────────────────────

function RequestForm() {
  const createDsr = useCreateDataSubjectRequest();
  const requestExport = useRequestDataExport();
  const requestDeletion = useRequestDataDeletion();

  const [requestType, setRequestType] = useState<DataSubjectRequestType>("access");
  const [description, setDescription] = useState("");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [deletionType, setDeletionType] = useState<DeletionType>("soft");

  const pending =
    createDsr.isPending || requestExport.isPending || requestDeletion.isPending;

  const handleCreateDsr = () => {
    if (!confirm(`Submit a "${humanize(requestType)}" data subject request?`)) {
      return;
    }
    const trimmed = description.trim();
    createDsr.mutate(
      trimmed
        ? { request_type: requestType, description: trimmed }
        : { request_type: requestType },
      {
        onSuccess: () => {
          toast.success("Data subject request submitted");
          setDescription("");
        },
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to submit request")),
      },
    );
  };

  const handleExport = () => {
    if (!confirm(`Request a ${exportFormat.toUpperCase()} export of this user's data?`)) {
      return;
    }
    requestExport.mutate(
      { format: exportFormat },
      {
        onSuccess: () => toast.success("Data export requested"),
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to request export")),
      },
    );
  };

  const handleDeletion = () => {
    if (
      !confirm(
        `Request a "${humanize(deletionType)}" deletion of this user's data? This is a GDPR erasure action.`,
      )
    ) {
      return;
    }
    requestDeletion.mutate(
      { deletion_type: deletionType, confirmed: true },
      {
        onSuccess: () => toast.success("Data deletion requested"),
        onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to request deletion")),
      },
    );
  };

  return (
    <div className="space-y-8">
      {/* Data Subject Request */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold">Create a data subject request</h3>
          <p className="text-xs text-muted-foreground">
            Raises a GDPR/DPA request against the signed-in user&apos;s own data.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dsr-type">Request type</Label>
            <Select
              value={requestType}
              onValueChange={(v) => setRequestType(v as DataSubjectRequestType)}
            >
              <SelectTrigger id="dsr-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="export">Export</SelectItem>
                <SelectItem value="rectify">Rectify</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dsr-description">Description (optional)</Label>
          <Textarea
            id="dsr-description"
            placeholder="Add any context for this request…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateDsr} disabled={pending}>
          {createDsr.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FileText className="mr-2 size-4" />
          )}
          Submit request
        </Button>
      </div>

      <div className="h-px bg-border" />

      {/* Data export */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold">Request a data export</h3>
          <p className="text-xs text-muted-foreground">
            Generates a downloadable export of the user&apos;s data.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="export-format">Format</Label>
            <Select
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as "json" | "csv")}
            >
              <SelectTrigger id="export-format">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={pending}>
          {requestExport.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Request export
        </Button>
      </div>

      <div className="h-px bg-border" />

      {/* Data deletion */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold">Request a data deletion</h3>
          <p className="text-xs text-muted-foreground">
            GDPR right-to-erasure. The request is confirmed on submission.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="deletion-type">Deletion type</Label>
            <Select
              value={deletionType}
              onValueChange={(v) => setDeletionType(v as DeletionType)}
            >
              <SelectTrigger id="deletion-type">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft (with retention)</SelectItem>
                <SelectItem value="anonymize">Anonymize</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={handleDeletion}
          disabled={pending}
        >
          {requestDeletion.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 size-4" />
          )}
          Request deletion
        </Button>
      </div>
    </div>
  );
}

// ── Requests table ────────────────────────────────────────────────────────────

function RequestsTable() {
  const { data, isLoading } = useDataSubjectRequests();
  const requests = data?.requests ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-10 text-center">
        <ShieldCheck className="mx-auto mb-2 size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No data subject requests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border border-border">
      <div className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Type</span>
        <span>Status</span>
        <span>Description</span>
        <span>Submitted</span>
      </div>
      {requests.map((r: DataSubjectRequest) => (
        <div
          key={r.id}
          className="grid grid-cols-[1fr_1fr_2fr_1fr] items-center gap-3 px-4 py-3 text-sm"
        >
          <span className="font-medium">{humanize(String(r.request_type))}</span>
          <span>
            <Badge variant={STATUS_VARIANT[String(r.status)] ?? "outline"}>
              {humanize(String(r.status))}
            </Badge>
          </span>
          <span className="truncate text-muted-foreground" title={r.description}>
            {r.description || "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {r.submitted_at
              ? new Date(r.submitted_at).toLocaleDateString()
              : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  return (
    <RequireAuth roles={["admin", "superuser"]}>
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Compliance
            </p>
            <h1 className="text-2xl font-bold">Data Subject Requests</h1>
            <p className="text-sm text-muted-foreground">
              Manage GDPR/DPA data subject requests, exports, and erasures.
            </p>
          </header>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  New Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequestForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequestsTable />
              </CardContent>
            </Card>
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
