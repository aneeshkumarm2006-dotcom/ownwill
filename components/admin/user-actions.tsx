"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Mail, Pause, Play, Trash2 } from "lucide-react";
import { Button, Modal } from "@/components/ui-kit";
import {
  deleteUser,
  resendVerification,
  sendPasswordReset,
  setUserPlan,
  setUserSuspended,
} from "@/app/admin/users/actions";

type Plan = "none" | "essentials" | "premium" | "premium_x2";

const PLAN_LABEL: Record<Plan, string> = {
  none: "Free",
  essentials: "Essentials",
  premium: "Premium",
  premium_x2: "Premium ×2",
};

export function UserActions({
  userId,
  email,
  currentPlan,
  suspended,
}: {
  userId: string;
  email: string;
  currentPlan: Plan;
  suspended: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<Plan>(currentPlan);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function run<T extends { error: string | null }>(fn: () => Promise<T>, success: string) {
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else toast.success(success);
      router.refresh();
    });
  }

  return (
    <div className="stack g-4">
      <div className="stack g-2">
        <label className="field-label">Plan</label>
        <div className="row g-2" style={{ flexWrap: "wrap" }}>
          <select className="select" value={plan} onChange={(e) => setPlan(e.target.value as Plan)} style={{ width: 180 }}>
            {(Object.keys(PLAN_LABEL) as Plan[]).map((p) => (
              <option key={p} value={p}>{PLAN_LABEL[p]}</option>
            ))}
          </select>
          <Button
            disabled={pending || plan === currentPlan}
            onClick={() => run(() => setUserPlan(userId, plan), plan === "none" ? "Plan revoked." : "Plan granted.")}
          >
            {plan === currentPlan ? "Same as current" : plan === "none" ? "Revoke plan" : "Grant plan"}
          </Button>
        </div>
      </div>

      <hr className="hr" />

      <div className="stack g-2">
        <span className="field-label">Account</span>
        <div className="row g-2" style={{ flexWrap: "wrap" }}>
          <Button variant="outline" icon={<Mail size={16} />} disabled={pending}
            onClick={() => run(() => resendVerification(userId, email), "Verification email resent.")}>
            Resend verification
          </Button>
          <Button variant="outline" icon={<KeyRound size={16} />} disabled={pending}
            onClick={() => run(() => sendPasswordReset(userId, email), "Password reset sent.")}>
            Send password reset
          </Button>
          <Button
            variant={suspended ? "outline" : "destructive"}
            icon={suspended ? <Play size={16} /> : <Pause size={16} />}
            disabled={pending}
            onClick={() => run(() => setUserSuspended(userId, !suspended), suspended ? "User unsuspended." : "User suspended.")}
          >
            {suspended ? "Unsuspend" : "Suspend"}
          </Button>
        </div>
      </div>

      <hr className="hr" />

      <div className="stack g-2">
        <span className="field-label" style={{ color: "var(--destructive)" }}>Danger zone</span>
        <Button variant="destructive" icon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)} disabled={pending}>
          Delete account permanently
        </Button>
        <p className="t-caption muted">Hard-deletes the auth user; profile + documents cascade. PIPEDA-compliant erase.</p>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this account?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                start(async () => {
                  const r = await deleteUser(userId);
                  if (r.error) { toast.error(r.error); return; }
                  toast.success("Account deleted.");
                  router.push("/admin/users");
                });
              }}
            >
              Yes, delete
            </Button>
          </>
        }
      >
        <p className="t-body">
          This permanently deletes <strong>{email}</strong> and all of their documents, payments, and email logs.
          This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
