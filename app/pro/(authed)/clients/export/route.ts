import { NextResponse } from "next/server";
import { requirePro } from "@/lib/pro/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";

const COLUMNS = [
  "user_id",
  "email",
  "full_name",
  "province",
  "status",
  "invited_at",
  "accepted_at",
  "revoked_at",
  "document_types",
  "documents_completed",
  "documents_generated",
] as const;

/**
 * CSV export of the calling org's client list. Reachable from the clients page
 * via a download button — the route is auth-gated through requirePro() so the
 * URL is share-safe (any visitor without a Pro session gets redirected to the
 * login page rather than the file).
 */
export async function GET() {
  const user = await requirePro();
  const admin = createAdminClient();

  const { data: links } = await admin
    .from("organization_clients")
    .select("user_id, invited_email, status, invited_at, accepted_at, revoked_at")
    .eq("organization_id", user.organizationId)
    .order("accepted_at", { ascending: false, nullsFirst: false })
    .order("invited_at", { ascending: false });
  const rows = links ?? [];

  const userIds = rows.map((r) => r.user_id as string);

  const [profilesRes, docsRes] = await Promise.all([
    userIds.length > 0
      ? admin.from("profiles").select("id, email, full_name, province").in("id", userIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    userIds.length > 0
      ? admin.from("documents").select("user_id, type, status").in("user_id", userIds).eq("is_current", true)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const profileById = new Map<string, { email: string; full_name: string; province: string | null }>();
  for (const p of profilesRes.data ?? []) {
    profileById.set(p.id as string, {
      email: (p.email as string) ?? "",
      full_name: (p.full_name as string) ?? "",
      province: (p.province as string) ?? null,
    });
  }
  const docsByUser = new Map<string, { types: Set<string>; completed: number; generated: number }>();
  for (const d of docsRes.data ?? []) {
    const uid = d.user_id as string;
    const slot = docsByUser.get(uid) ?? { types: new Set<string>(), completed: 0, generated: 0 };
    slot.types.add(d.type as string);
    if (d.status === "completed") slot.completed += 1;
    if (d.status === "generated") slot.generated += 1;
    docsByUser.set(uid, slot);
  }

  const csvRows = [COLUMNS.join(",")];
  for (const r of rows) {
    const uid = r.user_id as string;
    const profile = profileById.get(uid);
    const docs = docsByUser.get(uid);
    csvRows.push(
      [
        uid,
        profile?.email || (r.invited_email as string) || "",
        profile?.full_name || "",
        profile?.province || "",
        (r.status as string) || "",
        (r.invited_at as string) || "",
        (r.accepted_at as string) || "",
        (r.revoked_at as string) || "",
        Array.from(docs?.types ?? []).join("|"),
        docs?.completed ?? 0,
        docs?.generated ?? 0,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  await logAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "pro.client.export",
    targetType: "organization",
    targetId: user.organizationId,
    metadata: { count: rows.length, format: "csv" },
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `clients-${user.organizationSlug}-${dateStamp}.csv`;
  // Excel-friendly UTF-8 BOM so accented characters render correctly in
  // localized Excel installs without manually picking the import encoding.
  const body = "﻿" + csvRows.join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Defuse Excel formula injection (cells starting with =, +, -, @, |, %, \t,
  // \r) by prefixing a single quote — the prefix is stripped on display by
  // most consumers and prevents accidental formula evaluation on import.
  let safe = str;
  if (/^[=+\-@|%\t\r]/.test(safe)) safe = `'${safe}`;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
