import { CreditCard, FileText, Receipt } from "lucide-react";
import { requirePro, canManageBilling } from "@/lib/pro/auth";
import { AppPage } from "@/components/app/app-page";
import { Badge, Card } from "@/components/ui-kit";
import { getBillingOverview, listOrgInvoices } from "@/lib/pro/billing";
import { BillingPlans } from "@/components/pro/billing-plans";
import { BillingPortalButton } from "@/components/pro/billing-portal-button";

export const metadata = { title: "Billing — OwnWill Pro" };

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Past due",
  canceled: "Canceled",
  unpaid: "Unpaid",
  incomplete: "Setup incomplete",
  incomplete_expired: "Setup expired",
  paused: "Paused",
};

const STATUS_VARIANT: Record<string, "paid" | "completed" | "draft" | "warning" | "locked"> = {
  active: "paid",
  trialing: "completed",
  past_due: "warning",
  canceled: "locked",
  unpaid: "warning",
  incomplete: "draft",
  incomplete_expired: "draft",
  paused: "draft",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatStripeAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export default async function ProBillingPage() {
  const user = await requirePro();
  if (!canManageBilling(user.role)) {
    return (
      <AppPage breadcrumb={`${user.organizationName} · Pro`} title="Billing" wide>
        <Card>
          <p className="t-body-sm muted" style={{ margin: 0 }}>
            Only the firm owner can view billing. Ask your owner for an updated plan or invoice.
          </p>
        </Card>
      </AppPage>
    );
  }

  const [overview, invoices] = await Promise.all([
    getBillingOverview(user.organizationId),
    listOrgInvoices(user.organizationId, 10),
  ]);

  const statusLabel = overview.status ? STATUS_LABEL[overview.status] ?? overview.status : null;
  const statusVariant = overview.status ? STATUS_VARIANT[overview.status] ?? "draft" : "draft";

  return (
    <AppPage
      breadcrumb={`${user.organizationName} · Pro`}
      title="Billing"
      description="Manage your subscription, seats, and invoices."
      wide
      actions={overview.hasSubscription ? <BillingPortalButton /> : undefined}
    >
      <div className="stack g-4">
        <Card className="stack g-3">
          <div className="row g-2">
            <CreditCard size={18} />
            <h3 className="t-h5" style={{ margin: 0 }}>Current plan</h3>
            {statusLabel && <Badge variant={statusVariant}>{statusLabel}</Badge>}
          </div>
          <div
            className="grid g-3 plan-grid"
            style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
          >
            <Metric label="Plan" value={overview.planName} />
            <Metric
              label="Seats"
              value={`${overview.seatsUsed} / ${overview.seatCount}`}
              hint={
                overview.seatsUsed >= overview.seatCount
                  ? "Seat cap reached"
                  : `${overview.seatCount - overview.seatsUsed} available`
              }
            />
            <Metric label="Monthly" value={overview.monthlyTotalLabel ?? "—"} />
            <Metric
              label={overview.cancelAtPeriodEnd ? "Cancels on" : "Renews on"}
              value={formatDate(overview.currentPeriodEnd)}
            />
          </div>
          {overview.cancelAtPeriodEnd && (
            <p className="t-body-sm" style={{ margin: 0, color: "var(--destructive)" }}>
              Your subscription will end on {formatDate(overview.currentPeriodEnd)}. Re-enable it
              from the billing portal to keep team access.
            </p>
          )}
          {!overview.hasSubscription && (
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              You&rsquo;re on a free trial. Pick a plan below to keep inviting staff beyond the
              2-seat starter cap.
            </p>
          )}
        </Card>

        {!overview.hasSubscription || overview.status === "canceled" ? (
          <BillingPlans
            initialSeats={Math.max(overview.seatsUsed, 1)}
            hasSubscription={overview.hasSubscription}
            currentPlan={overview.plan}
          />
        ) : (
          <Card className="stack g-3">
            <div className="row g-2">
              <FileText size={18} />
              <h3 className="t-h5" style={{ margin: 0 }}>Change plan or seats</h3>
            </div>
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              Upgrades, downgrades, and seat-count changes happen in the Stripe billing portal
              &mdash; that way card updates, proration, and tax stay in one place.
            </p>
            <div>
              <BillingPortalButton label="Manage subscription" />
            </div>
          </Card>
        )}

        <Card className="stack g-3">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row g-2">
              <Receipt size={18} />
              <h3 className="t-h5" style={{ margin: 0 }}>Recent invoices</h3>
            </div>
            <span className="t-caption muted">{invoices.length} shown</span>
          </div>
          {invoices.length === 0 ? (
            <p className="t-body-sm muted" style={{ margin: 0 }}>
              No invoices yet. They&rsquo;ll appear here after your first billing cycle.
            </p>
          ) : (
            <ul className="stack g-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="row"
                  style={{
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <div className="t-body-sm" style={{ fontWeight: 600 }}>
                      {inv.number ?? inv.id}
                    </div>
                    <div className="t-caption muted">
                      {new Date(inv.created * 1000).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="row g-3" style={{ alignItems: "center" }}>
                    <span className="t-body-sm">
                      {formatStripeAmount(inv.amountPaid || inv.amountDue, inv.currency)}
                    </span>
                    {inv.status && (
                      <Badge variant={inv.status === "paid" ? "paid" : "draft"}>
                        {inv.status}
                      </Badge>
                    )}
                    {inv.hostedInvoiceUrl && (
                      <a
                        href={inv.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-body-sm focusable"
                      >
                        View
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .plan-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 520px) {
          .plan-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </AppPage>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="t-caption muted">{label}</div>
      <div className="t-h5" style={{ margin: "4px 0 0" }}>{value}</div>
      {hint && <div className="t-caption muted" style={{ marginTop: 2 }}>{hint}</div>}
    </div>
  );
}
