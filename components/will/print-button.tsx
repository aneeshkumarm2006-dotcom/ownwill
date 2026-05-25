"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui-kit";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} icon={<Printer size={16} />}>
      Print / Save as PDF
    </Button>
  );
}
