"use client";

import { useState } from "react";
import { Bell, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { RequireAuth } from "@/components/auth/require-auth";
import { SiteShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  useCreateTemplate,
  useDeleteTemplate,
  useNotificationEvents,
  useNotificationTemplates,
  useUpdateTemplate,
} from "@/hooks/use-notification-templates";
import type {
  CreateTemplateRequest,
  NotificationChannel,
  NotificationTemplate,
} from "@/lib/api/notifications";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "in_app", label: "In-app" },
];

// Common event keys from domain.go NotificationEventKey constants.
const EVENT_KEYS = [
  "order.created",
  "order.confirmed",
  "order.ready",
  "order.picked_up",
  "order.delivered",
  "order.cancelled",
  "order.status_changed",
  "payment.succeeded",
  "payment.failed",
  "refund.processed",
  "delivery.driver_assigned",
  "delivery.en_route",
  "delivery.eta_updated",
  "delivery.completed",
  "loyalty.points_awarded",
  "loyalty.points_redeemed",
  "loyalty.tier_changed",
  "support.ticket_created",
  "support.ticket_updated",
  "support.ticket_resolved",
  "support.ticket_escalated",
];

function channelLabel(channel: string) {
  return CHANNELS.find((c) => c.value === channel)?.label ?? channel;
}

// ── Template form dialog (create + edit) ──────────────────────────────

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NotificationTemplate | null;
}

function TemplateDialog({ open, onOpenChange, template }: TemplateDialogProps) {
  const isEdit = !!template;
  const createMut = useCreateTemplate();
  const updateMut = useUpdateTemplate();

  const [channel, setChannel] = useState<NotificationChannel>(
    (template?.channel as NotificationChannel) ?? "email",
  );
  const [eventKey, setEventKey] = useState(template?.event_key ?? EVENT_KEYS[0]);
  const [locale, setLocale] = useState(template?.locale ?? "en");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);

  // Re-seed form fields whenever the dialog target changes.
  const [seedKey, setSeedKey] = useState<string | null>(null);
  const currentKey = template?.id ?? "__new__";
  if (open && seedKey !== currentKey) {
    setSeedKey(currentKey);
    setChannel((template?.channel as NotificationChannel) ?? "email");
    setEventKey(template?.event_key ?? EVENT_KEYS[0]);
    setLocale(template?.locale ?? "en");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setIsActive(template?.is_active ?? true);
  }
  if (!open && seedKey !== null) {
    setSeedKey(null);
  }

  const pending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Body is required.");
      return;
    }

    if (isEdit && template) {
      updateMut.mutate(
        {
          id: template.id,
          body: {
            subject: subject.trim() || undefined,
            body,
            is_active: isActive,
          },
        },
        {
          onSuccess: () => {
            toast.success("Template updated");
            onOpenChange(false);
          },
          onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to update template")),
        },
      );
      return;
    }

    if (!eventKey || !locale.trim()) {
      toast.error("Event and locale are required.");
      return;
    }

    const payload: CreateTemplateRequest = {
      channel,
      event_key: eventKey,
      locale: locale.trim(),
      subject: subject.trim() || undefined,
      body,
    };
    createMut.mutate(payload, {
      onSuccess: () => {
        toast.success("Template created");
        onOpenChange(false);
      },
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to create template")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-channel">Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as NotificationChannel)}
                disabled={isEdit}
              >
                <SelectTrigger id="tpl-channel">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-event">Event</Label>
              <Select value={eventKey} onValueChange={setEventKey} disabled={isEdit}>
                <SelectTrigger id="tpl-event">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-locale">Locale</Label>
              <Input
                id="tpl-locale"
                placeholder="en"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                disabled={isEdit}
              />
            </div>
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="tpl-active">Status</Label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(v) => setIsActive(v === "active")}
                >
                  <SelectTrigger id="tpl-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-subject">Subject</Label>
            <Input
              id="tpl-subject"
              placeholder="Optional (used for email / push title)"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tpl-body">Body</Label>
            <Textarea
              id="tpl-body"
              rows={6}
              placeholder="Message body. Supports template variables, e.g. {{order_id}}."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Channel, event and locale identify a template and cannot be changed
              after creation.
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Templates section ─────────────────────────────────────────────────

function TemplatesSection() {
  const { data, isLoading } = useNotificationTemplates();
  const deleteMut = useDeleteTemplate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const templates = data?.templates ?? [];

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (tpl: NotificationTemplate) => {
    setEditing(tpl);
    setDialogOpen(true);
  };

  const handleDelete = (tpl: NotificationTemplate) => {
    if (!confirm(`Delete the "${tpl.event_key}" (${channelLabel(tpl.channel)}) template?`)) {
      return;
    }
    setDeletingId(tpl.id);
    deleteMut.mutate(tpl.id, {
      onSuccess: () => toast.success("Template deleted"),
      onError: async (err) => toast.error(await apiErrorMessage(err, "Failed to delete template")),
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          Templates
        </CardTitle>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          New Template
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <div className="py-10 text-center">
            <FileText className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No notification templates yet. Create one to customize messages.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border border-border">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Event</span>
              <span>Channel</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{tpl.event_key}</p>
                  {tpl.subject ? (
                    <p className="truncate text-xs text-muted-foreground">{tpl.subject}</p>
                  ) : null}
                  <span className="text-[11px] uppercase text-muted-foreground">
                    {tpl.locale}
                  </span>
                </div>
                <span className="text-sm">{channelLabel(tpl.channel)}</span>
                <span>
                  <Badge variant={tpl.is_active ? "soft" : "outline"} className="text-[10px]">
                    {tpl.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(tpl)}>
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === tpl.id}
                    onClick={() => handleDelete(tpl)}
                  >
                    {deletingId === tpl.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <TemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editing} />
    </Card>
  );
}

// ── Event log section ─────────────────────────────────────────────────

function statusVariant(status: string): "default" | "soft" | "outline" {
  if (status === "failed") return "default";
  if (status === "delivered" || status === "sent") return "soft";
  return "outline";
}

function EventLogSection() {
  const { data, isLoading } = useNotificationEvents({ limit: 25 });
  const events = data?.events ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Recent Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No notification events recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border border-border">
            <div className="grid grid-cols-[1.5fr_1fr_0.6fr_1fr] gap-3 bg-muted/30 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Event</span>
              <span>Status</span>
              <span>Attempts</span>
              <span>When</span>
            </div>
            {events.map((ev) => (
              <div
                key={ev.id}
                className="grid grid-cols-[1.5fr_1fr_0.6fr_1fr] items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm">{ev.event_key}</p>
                  {ev.error_message ? (
                    <p className="truncate text-xs text-destructive" title={ev.error_message}>
                      {ev.error_message}
                    </p>
                  ) : null}
                </div>
                <span>
                  <Badge variant={statusVariant(ev.status)} className="text-[10px] capitalize">
                    {ev.status}
                  </Badge>
                </span>
                <span className="text-sm text-muted-foreground">{ev.attempts}</span>
                <span className="text-xs text-muted-foreground">
                  {ev.created_at ? new Date(ev.created_at).toLocaleString() : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function NotificationsManagementPage() {
  return (
    <RequireAuth
      roles={["admin", "superuser", "manager"]}
      permissions={["ordering.config.manage"]}
      permissionOperator="or"
    >
      <SiteShell>
        <div className="mx-auto w-full max-w-4xl px-4 py-6">
          <header className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Communications
            </p>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Manage notification templates and review recently dispatched
              notifications for this organization.
            </p>
          </header>

          <div className="space-y-6">
            <TemplatesSection />
            <EventLogSection />
          </div>
        </div>
      </SiteShell>
    </RequireAuth>
  );
}
