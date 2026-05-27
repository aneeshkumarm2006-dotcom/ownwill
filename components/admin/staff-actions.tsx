"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { grantStaffRole, revokeStaff } from "@/app/admin/(authed)/staff/actions";

type Role = "support" | "admin" | "super_admin";

export function StaffGrantForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("support");
  const [pending, start] = useTransition();

  function submit() {
    if (!email.trim()) {
      toast.error("Enter an email.");
      return;
    }
    start(async () => {
      const r = await grantStaffRole({ email: email.trim(), role });
      if (r.error) toast.error(r.error);
      else {
        toast.success(`Granted ${role}.`);
        setEmail("");
        router.refresh();
      }
    });
  }

  return (
    <div className="stack g-2">
      <div className="row g-2" style={{ flexWrap: "wrap" }}>
        <input
          className="input"
          type="email"
          placeholder="teammate@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: "1 1 240px", minWidth: 220 }}
          disabled={pending}
        />
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          style={{ width: 180 }}
          disabled={pending}
        >
          <option value="support">Support</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <Button icon={<UserPlus size={16} />} onClick={submit} disabled={pending}>
          {pending ? "Granting…" : "Grant role"}
        </Button>
      </div>
      <p className="t-caption muted">
        The user must have signed up first. Lookup is by email (case-insensitive).
      </p>
    </div>
  );
}

export function StaffRevokeButton({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      icon={<Trash2 size={14} />}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Revoke staff access from ${email}? They'll become a regular customer.`)) return;
        start(async () => {
          const r = await revokeStaff(userId);
          if (r.error) toast.error(r.error);
          else {
            toast.success("Staff access revoked.");
            router.refresh();
          }
        });
      }}
    >
      Revoke
    </Button>
  );
}

export function StaffChangeRoleSelect({
  email,
  currentRole,
}: {
  email: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onChange(nextRole: Role) {
    if (nextRole === currentRole) return;
    if (!confirm(`Change ${email} from ${currentRole} to ${nextRole}?`)) return;
    start(async () => {
      const r = await grantStaffRole({ email, role: nextRole });
      if (r.error) toast.error(r.error);
      else {
        toast.success(`Role updated to ${nextRole}.`);
        router.refresh();
      }
    });
  }

  return (
    <select
      className="select"
      value={currentRole}
      onChange={(e) => onChange(e.target.value as Role)}
      style={{ width: 160 }}
      disabled={pending}
    >
      <option value="support">Support</option>
      <option value="admin">Admin</option>
      <option value="super_admin">Super admin</option>
    </select>
  );
}
