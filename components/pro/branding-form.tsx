"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Image as ImageIcon, Save, Trash2, Upload } from "lucide-react";
import { Button, Card, Field, Input, Modal } from "@/components/ui-kit";
import {
  removeOrgLogo,
  updateOrgSettings,
  uploadOrgLogo,
} from "@/lib/pro/actions";

interface Props {
  initialName: string;
  initialPrimaryColor: string;
  logoUrl: string | null;
  canEdit: boolean;
}

const MAX_LOGO_MB = 2;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Pro: white-label settings form. Owner/admin gated server-side; we still
 * disable controls for read-only roles so they don't appear actionable.
 *
 * Two independent flows here:
 *  1. Org metadata (name + primary color) — single POST via updateOrgSettings.
 *  2. Logo blob — multipart upload via uploadOrgLogo (FormData), removable via
 *     removeOrgLogo. Kept separate so a color tweak doesn't force the user to
 *     re-upload the logo file.
 */
export function BrandingForm({
  initialName,
  initialPrimaryColor,
  logoUrl,
  canEdit,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialPrimaryColor);
  const [savingMeta, setSavingMeta] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, startRemove] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const dirty = name !== initialName || color !== initialPrimaryColor;

  async function saveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSavingMeta(true);
    const res = await updateOrgSettings({ name: name.trim(), primaryColor: color.trim() });
    setSavingMeta(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Settings saved.");
    router.refresh();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Use a PNG, JPG, or WebP file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(`Logo must be under ${MAX_LOGO_MB} MB.`);
      e.target.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    const res = await uploadOrgLogo(fd);
    setUploading(false);
    e.target.value = "";
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Logo updated.");
    router.refresh();
  }

  function handleRemoveLogo() {
    setConfirmRemove(false);
    startRemove(async () => {
      const res = await removeOrgLogo();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Logo removed.");
      router.refresh();
    });
  }

  const swatch = isValidHexInput(color) ? color : "#0E4C49";

  return (
    <div className="stack g-4">
      <Card className="stack g-4">
        <div className="row g-2">
          <ImageIcon size={18} />
          <h3 className="t-h5" style={{ margin: 0 }}>Logo</h3>
        </div>
        <p className="t-body-sm muted" style={{ margin: 0 }}>
          Shown on client invitation emails and (in a later release) on the customer dashboard
          banner. PNG, JPG, or WebP — max {MAX_LOGO_MB} MB.
        </p>

        <div className="row g-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 120,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 8,
              flex: "none",
            }}
            aria-label={logoUrl ? "Current logo" : "No logo set"}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Current logo"
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : (
              <span className="t-caption muted">No logo</span>
            )}
          </div>
          <div className="stack g-2">
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_LOGO_TYPES.join(",")}
              onChange={onPickFile}
              disabled={!canEdit || uploading}
              hidden
            />
            <div className="row g-2">
              <Button
                icon={<Upload size={14} />}
                onClick={() => fileInput.current?.click()}
                disabled={!canEdit || uploading}
                loading={uploading}
              >
                {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
              {logoUrl && (
                <Button
                  variant="outline"
                  icon={<Trash2 size={14} />}
                  onClick={() => setConfirmRemove(true)}
                  disabled={!canEdit || removing}
                >
                  Remove
                </Button>
              )}
            </div>
            {!canEdit && (
              <span className="t-caption muted">
                Ask an owner or admin to update branding.
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card className="stack g-4">
        <form onSubmit={saveMeta} className="stack g-4">
          <h3 className="t-h5" style={{ margin: 0 }}>Firm details</h3>

          <Field label="Firm name" htmlFor="org-name" hint="Shown to clients on their dashboard and on invite emails.">
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit || savingMeta}
              maxLength={200}
            />
          </Field>

          <Field
            label="Primary color"
            htmlFor="org-color"
            hint="Hex like #0E4C49. Used for the call-to-action button on client emails. Leave blank for OwnWill default."
          >
            <div className="row g-2" style={{ alignItems: "center" }}>
              <Input
                id="org-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#0E4C49"
                disabled={!canEdit || savingMeta}
                maxLength={7}
                style={{ maxWidth: 160, fontFamily: "var(--font-mono, monospace)" }}
              />
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: swatch,
                  flex: "none",
                }}
              />
              <span className="t-caption muted">
                {isValidHexInput(color) || color.trim() === ""
                  ? "Looks good"
                  : "Use a 3- or 6-digit hex"}
              </span>
            </div>
          </Field>

          <div className="row g-2">
            <Button
              type="submit"
              icon={<Save size={14} />}
              disabled={!canEdit || savingMeta || !dirty}
              loading={savingMeta}
            >
              {savingMeta ? "Saving…" : dirty ? "Save changes" : "Saved"}
            </Button>
            {dirty && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setName(initialName);
                  setColor(initialPrimaryColor);
                }}
                disabled={savingMeta}
              >
                Discard
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove the firm logo?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveLogo} disabled={removing}>
              Yes, remove
            </Button>
          </>
        }
      >
        <p className="t-body">
          Client emails will fall back to the stock OwnWill mark until you upload a new logo.
        </p>
      </Modal>
    </div>
  );
}

function isValidHexInput(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}
