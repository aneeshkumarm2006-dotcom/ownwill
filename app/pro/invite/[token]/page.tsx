import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Button, Card } from "@/components/ui-kit";
import { getInvitationPreview } from "@/lib/pro/actions";
import { ProInviteAccept } from "@/components/pro/pro-invite-accept";

/**
 * Cookie used to carry a pending invite token through signup + email
 * verification, so the customer doesn't have to chase the email link again
 * after creating an account. Consumed by `app/(app)/layout.tsx` on first
 * authenticated page load.
 */
const PENDING_INVITE_COOKIE = "ow_pending_invite";

export const metadata = { title: "Accept invitation — OwnWill" };

interface PageProps {
  params: Promise<{ token: string }>;
}

function InviteError({ message }: { message: string }) {
  return (
    <div className="stack g-4" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
      <Card padded className="stack g-3">
        <h1 className="t-h3" style={{ margin: 0 }}>Can't use this invitation</h1>
        <p className="t-body muted" style={{ margin: 0 }}>{message}</p>
        <Button href="/" variant="outline">Back to OwnWill</Button>
      </Card>
    </div>
  );
}

export default async function ProInviteTokenPage({ params }: PageProps) {
  const { token } = await params;

  const preview = await getInvitationPreview(token);
  if (preview.error || !preview.data) {
    return <InviteError message={preview.error ?? "Invitation not found."} />;
  }
  if (preview.data.expired) {
    return (
      <InviteError message="This invitation has expired. Ask the sender for a new one." />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed in → render the accept button. requirePro() doesn't apply here
  // because invitees may not have a Pro membership yet (the accept creates
  // the membership row).
  if (user) {
    return (
      <ProInviteAccept
        token={token}
        orgName={preview.data.orgName}
        kind={preview.data.kind}
        role={preview.data.role}
        inviteEmail={preview.data.email}
        signedInEmail={user.email ?? null}
      />
    );
  }

  // Anonymous → ask them to sign in or sign up. We use the `?redirectTo=`
  // param the customer login already honors so sign-in lands them back on
  // this page. Even staff invitees go through /signup (which only creates an
  // auth user); the staff membership row is written by acceptInvitation
  // after they return signed-in. This avoids the trap of /pro/signup
  // accidentally creating a second org for someone who was meant to join an
  // existing one.
  const returnTo = `/pro/invite/${encodeURIComponent(token)}`;
  const signupHref = `/signup?invite=${encodeURIComponent(token)}`;
  const signinHref = `/login?redirectTo=${encodeURIComponent(returnTo)}`;

  // Stash the token in a short-lived cookie so it survives the signup +
  // email-verification round trip. `app/(app)/layout.tsx` consumes the cookie
  // on first authenticated page load — the user lands on /dashboard with
  // their org link already created.
  const cookieStore = await cookies();
  cookieStore.set(PENDING_INVITE_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14, // matches the invite's 14-day expiry
  });

  return (
    <div className="stack g-4" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
      <Card padded className="stack g-3">
        <span className="t-overline muted">
          {preview.data.kind === "staff" ? "Team invitation" : "Client invitation"}
        </span>
        <h1 className="t-h2" style={{ margin: 0 }}>
          Join {preview.data.orgName}
        </h1>
        <p className="t-body muted" style={{ margin: 0 }}>
          {preview.data.kind === "staff" ? (
            <>You've been invited to join <strong>{preview.data.orgName}</strong> as a teammate. Sign in or create an account to accept.</>
          ) : (
            <>
              <strong>{preview.data.orgName}</strong> would like to help you with your will on
              OwnWill. Sign in or create an account to accept this invitation.
            </>
          )}
        </p>
        <p className="t-body-sm muted" style={{ margin: 0 }}>
          Sent to <strong>{preview.data.email}</strong>.
        </p>
        <div className="row g-2 mt-2" style={{ flexWrap: "wrap" }}>
          <Button href={signupHref} size="lg">Create account</Button>
          <Button href={signinHref} variant="outline" size="lg">I have an account</Button>
        </div>
        <p className="t-caption muted" style={{ marginTop: 8 }}>
          Already on OwnWill?{" "}
          <Link href={signinHref} className="link">Sign in</Link> with the email that received this
          invitation.
        </p>
      </Card>
    </div>
  );
}
