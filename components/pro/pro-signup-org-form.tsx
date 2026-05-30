"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Globe } from "lucide-react";
import { Button, Field, Input } from "@/components/ui-kit";
import { Dropdown } from "@/components/ui/dropdown";
import { AuthShell, AuthHeader } from "@/components/auth/auth-shell";
import {
  createOrganization,
  isOrgSlugAvailable,
  suggestOrgSlug,
} from "@/lib/pro/actions";
import { PROVINCE_OPTIONS } from "@/types";

type OrgType = "advisor" | "funeral" | "law" | "employer" | "other";

const TYPE_OPTIONS: { value: OrgType; label: string }[] = [
  { value: "law", label: "Law firm (paralegal-led)" },
  { value: "advisor", label: "Financial advisor" },
  { value: "funeral", label: "Funeral home" },
  { value: "employer", label: "Employer / group benefits" },
  { value: "other", label: "Other" },
];

const SLUG_PROVISIONAL = "Checking availability…";

/**
 * Step 2 of the Pro signup wizard. Runs when the visitor is signed in but
 * doesn't have an active org yet — collects firm details and calls
 * createOrganization, which writes the org row + owner membership.
 */
export function ProSignupOrgForm({ ownerEmail }: { ownerEmail: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("law");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [province, setProvince] = useState("");
  const [licensingNumber, setLicensingNumber] = useState("");
  const [billingEmail, setBillingEmail] = useState(ownerEmail);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">(
    "idle",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const slugDebounce = useRef<number | null>(null);

  // Auto-derive the slug from the firm name until the user edits it manually.
  useEffect(() => {
    if (slugTouched) return;
    let cancelled = false;
    (async () => {
      const suggested = await suggestOrgSlug(name);
      if (!cancelled) setSlug(suggested);
    })();
    return () => {
      cancelled = true;
    };
  }, [name, slugTouched]);

  // Debounced availability check — runs on every slug change after a short
  // pause, so the user gets feedback before they hit Create.
  useEffect(() => {
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    if (slugDebounce.current) window.clearTimeout(slugDebounce.current);
    slugDebounce.current = window.setTimeout(async () => {
      const available = await isOrgSlugAvailable(slug);
      // If the slug failed the regex it's "invalid" — distinguish from "taken"
      // to give a sharper error message.
      if (!available) {
        setSlugStatus(/^[a-z][a-z0-9-]{2,38}[a-z0-9]$/.test(slug) ? "taken" : "invalid");
      } else {
        setSlugStatus("ok");
      }
    }, 350);
    return () => {
      if (slugDebounce.current) window.clearTimeout(slugDebounce.current);
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Firm name is too short.";
    if (slug.trim().length < 4) errs.slug = "URL slug is too short.";
    if (slugStatus === "taken") errs.slug = "That URL is already taken.";
    if (slugStatus === "invalid") errs.slug = "Use lowercase letters, numbers, and hyphens.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    const res = await createOrganization({
      name: name.trim(),
      type,
      slug: slug.trim().toLowerCase(),
      billingEmail: billingEmail.trim() || undefined,
      licensingNumber: licensingNumber.trim() || undefined,
      province: province || undefined,
    });
    if (res.error) {
      setLoading(false);
      toast.error(res.error);
      return;
    }
    toast.success("Your firm is live. Welcome to OwnWill Pro!");
    router.push("/pro/dashboard");
    router.refresh();
  }

  const slugHint =
    slugStatus === "checking"
      ? SLUG_PROVISIONAL
      : slugStatus === "ok"
        ? "Available!"
        : "3–40 lowercase letters, numbers, or hyphens.";

  return (
    <AuthShell>
      <AuthHeader
        title="Set up your firm"
        subtitle="Step 2 of 2 — your firm's details. You can edit any of this later."
      />
      <form onSubmit={handleSubmit} className="stack g-4">
        <Field label="Firm name" error={errors.name} htmlFor="orgname">
          <Input
            id="orgname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Robichaud Estate Law"
            leadingIcon={<Briefcase size={16} />}
          />
        </Field>
        <Field label="Firm type" htmlFor="orgtype">
          <Dropdown
            id="orgtype"
            value={type}
            onChange={(v) => setType(v as OrgType)}
            options={TYPE_OPTIONS}
          />
        </Field>
        <Field
          label="URL slug"
          error={errors.slug}
          hint={slugHint}
          htmlFor="slug"
        >
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase());
              setSlugTouched(true);
            }}
            placeholder="robichaud-estate"
            leadingIcon={<Globe size={16} />}
            error={slugStatus === "taken" || slugStatus === "invalid"}
          />
        </Field>
        <Field label="Province" htmlFor="orgprov" hint="Where the firm is based (optional).">
          <Dropdown
            id="orgprov"
            value={province}
            onChange={(v) => setProvince(v)}
            options={[{ value: "", label: "Not specified" }, ...PROVINCE_OPTIONS]}
          />
        </Field>
        <Field label="Bar / licensing number" htmlFor="lic" hint="Optional. Visible only to your team.">
          <Input
            id="lic"
            value={licensingNumber}
            onChange={(e) => setLicensingNumber(e.target.value)}
            placeholder="e.g. LSO #12345"
          />
        </Field>
        <Field label="Billing email" htmlFor="bill" hint="Where invoices land. Defaults to your work email.">
          <Input
            id="bill"
            type="email"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            placeholder={ownerEmail}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="btn-block"
          loading={loading}
          disabled={slugStatus === "checking" || slugStatus === "taken" || slugStatus === "invalid"}
        >
          {loading ? "Creating your firm…" : "Create firm"}
        </Button>
      </form>
    </AuthShell>
  );
}
