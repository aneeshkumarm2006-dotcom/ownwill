"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { Button, Modal, Textarea } from "@/components/ui-kit";
import { revokeClient, updateClientNotes } from "@/lib/pro/actions";

interface Props {
  clientUserId: string;
  clientLabel: string;
  initialNotes: string;
  status: "invited" | "active" | "revoked";
  canEdit: boolean;
  canRevoke: boolean;
}

/**
 * Pro: action panel on the client detail page. Notes edit + revoke control.
 * Read-only roles (`viewer`) see the notes but can't edit; the same role
 * doesn't see the revoke button at all.
 */
export function ClientActions({
  clientUserId,
  clientLabel,
  initialNotes,
  status,
  canEdit,
  canRevoke,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [pending, start] = useTransition();
  const dirty = notes !== savedNotes;

  async function saveNotes() {
    if (!canEdit) return;
    setSavingNotes(true);
    const res = await updateClientNotes(clientUserId, notes);
    setSavingNotes(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setSavedNotes(notes);
    toast.success("Notes saved.");
    router.refresh();
  }

  function handleRevoke() {
    setConfirmRevoke(false);
    start(async () => {
      const res = await revokeClient(clientUserId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${clientLabel || "Client"} removed.`);
      router.refresh();
    });
  }

  return (
    <div className="stack g-4">
      <div className="stack g-2">
        <label className="field-label" htmlFor="client-notes">
          Private notes
        </label>
        <Textarea
          id="client-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            canEdit
              ? "Internal context for your team — never shown to the client."
              : "No notes."
          }
          readOnly={!canEdit}
          rows={5}
        />
        {canEdit && (
          <div className="row g-2">
            <Button
              size="sm"
              icon={<Save size={14} />}
              onClick={saveNotes}
              loading={savingNotes}
              disabled={!dirty || savingNotes}
            >
              {savingNotes ? "Saving…" : dirty ? "Save notes" : "Saved"}
            </Button>
            {dirty && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setNotes(savedNotes)}
                disabled={savingNotes}
              >
                Discard
              </Button>
            )}
          </div>
        )}
      </div>

      {canRevoke && status === "active" && (
        <>
          <hr className="hr" />
          <div className="stack g-2">
            <span className="field-label" style={{ color: "var(--destructive)" }}>
              Danger zone
            </span>
            <Button
              variant="destructive"
              icon={<Trash2 size={16} />}
              onClick={() => setConfirmRevoke(true)}
              disabled={pending}
            >
              Remove this client
            </Button>
            <p className="t-caption muted">
              Soft-revokes the link. Their documents stay with them; you&apos;ll lose visibility
              until they&apos;re re-invited.
            </p>
          </div>
        </>
      )}

      <Modal
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        title="Remove this client?"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={pending}>
              Yes, remove
            </Button>
          </>
        }
      >
        <p className="t-body">
          You&apos;ll lose access to <strong>{clientLabel}</strong>&apos;s documents and activity.
          Their documents stay with them. You can re-invite later — that creates a fresh
          link the client must accept.
        </p>
      </Modal>
    </div>
  );
}
