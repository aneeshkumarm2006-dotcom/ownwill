"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { updateVersion } from "@/app/admin/(authed)/templates/actions";

export function TemplateEditor({
  id,
  initialBody,
  initialChangeNotes,
}: {
  id: string;
  initialBody: string;
  initialChangeNotes: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [changeNotes, setChangeNotes] = useState(initialChangeNotes);
  const [pending, start] = useTransition();

  const dirty = body !== initialBody || changeNotes !== initialChangeNotes;

  function save() {
    start(async () => {
      const r = await updateVersion({ id, body, changeNotes });
      if (r.error) toast.error(r.error);
      else {
        toast.success("Saved.");
        router.refresh();
      }
    });
  }

  return (
    <div className="stack g-3">
      <div className="stack g-1">
        <label className="field-label" htmlFor={`body-${id}`}>Body</label>
        <textarea
          id={`body-${id}`}
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          spellCheck
          style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, lineHeight: 1.6 }}
          placeholder="Legal copy for this (type, province). Markdown or plain text — renderer migration will define the format."
        />
        <p className="t-caption muted">
          Free-form text for now. When the renderer migration ships, the format will be defined
          (Markdown with <code>{"{{ placeholder }}"}</code> tokens for form fields).
        </p>
      </div>

      <div className="stack g-1">
        <label className="field-label" htmlFor={`notes-${id}`}>Change notes (for reviewer)</label>
        <textarea
          id={`notes-${id}`}
          className="textarea"
          value={changeNotes}
          onChange={(e) => setChangeNotes(e.target.value)}
          rows={3}
          placeholder="What's new in this version? E.g. updated executor language per 2025 ON Succession Law Reform Act amendments."
        />
      </div>

      <div className="row g-2">
        <Button onClick={save} disabled={!dirty || pending} icon={<Save size={16} />}>
          {pending ? "Saving…" : "Save draft"}
        </Button>
        {dirty && <span className="t-caption muted" style={{ alignSelf: "center" }}>Unsaved changes.</span>}
      </div>
    </div>
  );
}
