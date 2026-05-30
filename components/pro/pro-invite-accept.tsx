"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, FileText } from "lucide-react";
import { Button, Card } from "@/components/ui-kit";
import { acceptInvitation } from "@/lib/pro/actions";

interface Props {
  token: string;
  orgName: string;
  kind: "staff" | "client";
  role: string | null;
  inviteEmail: string;
  signedInEmail: string | null;
}

/**
 * Client component that renders the "accept" button for someone who is
 * already signed in. Pre-signin visitors get the sign-in/sign-up prompt
 * rendered from the page server component instead.
 */
export function ProInviteAccept({ token, orgName, kind, role, inviteEmail, signedInEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const emailMismatch =
    signedInEmail && signedInEmail.toLowerCase() !== inviteEmail.toLowerCase();

  async function handleAccept() {
    setLoading(true);
    const res = await acceptInvitation(token);
    if (res.error) {
      setLoading(false);
      toast.error(res.error);
      return;
    }
    toast.success(
      res.data?.kind === "staff"
        ? `You're in. Welcome to ${orgName}.`
        : `${orgName} can now help you with your documents.`,
    );
    // Staff → Pro dashboard; clients → their customer dashboard so they can
    // start (or continue) their will.
    router.push(res.data?.kind === "staff" ? "/pro/dashboard" : "/dashboard");
    router.refresh();
  }

  return (
    <div className="stack g-4" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
      <Card padded className="stack g-4">
        <div className="row g-2">
          {kind === "staff" ? <Briefcase size={18} /> : <FileText size={18} />}
          <span className="t-overline muted">
            {kind === "staff" ? "Team invitation" : "Client invitation"}
          </span>
        </div>
        <h1 className="t-h2" style={{ margin: 0 }}>
          Join {orgName}
        </h1>
        <p className="t-body muted" style={{ margin: 0 }}>
          {kind === "staff" ? (
            <>You've been invited to join <strong>{orgName}</strong> as <strong>{role ?? "a teammate"}</strong>.</>
          ) : (
            <>
              <strong>{orgName}</strong> would like to help you with your will and powers of attorney
              on OwnWill. You stay in control of your documents and can revoke access at any time
              from your account settings.
            </>
          )}
        </p>
        {emailMismatch && (
          <div
            className="t-body-sm"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--muted)",
              border: "1px solid var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Heads up: the invitation was sent to <strong>{inviteEmail}</strong>, but you're signed in
            as <strong>{signedInEmail}</strong>. Accepting will tie this invitation to your current
            account.
          </div>
        )}
        <Button onClick={handleAccept} loading={loading} size="lg">
          {loading
            ? "Accepting…"
            : kind === "staff"
              ? `Accept and join ${orgName}`
              : `Accept and start my documents`}
        </Button>
        <Button variant="link" href="/">Not now</Button>
      </Card>
    </div>
  );
}
