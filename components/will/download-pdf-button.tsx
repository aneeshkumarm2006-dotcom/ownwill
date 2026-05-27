"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui-kit";

/** Generates a document PDF server-side (Puppeteer → Storage) and opens it. */
export function DownloadPdfButton({
  type = "will",
  label = "Download PDF",
  size = "default",
}: {
  type?: string;
  label?: string;
  size?: "default" | "lg" | "sm";
}) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = (await res.json()) as
        | { ok: true; data: { url: string } }
        | { ok: false; error: string };
      if (!json.ok) {
        toast.error(json.error || "Couldn't generate the PDF. Try the print view.");
        return;
      }

      const pdfRes = await fetch(json.data.url);
      if (!pdfRes.ok) {
        toast.error("Couldn't download the PDF. Try the print view.");
        return;
      }
      const blob = await pdfRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${type}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      toast.error("Couldn't reach the PDF service. Try the print view.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size={size} onClick={generate} loading={loading} icon={<Download size={size === "lg" ? 18 : 16} />}>
      {loading ? "Generating…" : label}
    </Button>
  );
}
