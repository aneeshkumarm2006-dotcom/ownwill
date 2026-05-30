"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, UserPlus } from "lucide-react";
import { Button, Field, Input, Modal } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { inviteStaff } from "@/lib/pro/actions";

type Role = "admin" | "member" | "viewer";
const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "member", label: "Member (default)" },
  { value: "admin", label: "Admin (can invite + manage staff)" },
  { value: "viewer", label: "Viewer (read-only)" },
];

/**
 * Modal launched from the Pro dashboard. Phase 1 entry point for the
 * staff-invite flow; will move to /pro/team in Phase 2.
 */
export function InviteStaffModal({ orgName }: { orgName: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim().includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }
    setLoading(true);
    const res = await inviteStaff({ email: email.trim(), role });
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Invitation sent to ${email.trim()}.`);
    setEmail("");
    setRole("member");
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} icon={<UserPlus size={16} />}>
        Invite a teammate
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Invite a teammate to ${orgName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {loading ? "Sending…" : "Send invitation"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="stack g-4" style={{ marginTop: 4 }}>
          <Field label="Email" htmlFor="invite-email" hint="They'll get a link to join your org.">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@firm.ca"
              leadingIcon={<Mail size={16} />}
              autoComplete="off"
            />
          </Field>
          <Field label="Role" htmlFor="invite-role">
            <Dropdown
              id="invite-role"
              value={role}
              onChange={(v) => setRole(v as Role)}
              options={ROLE_OPTIONS}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
