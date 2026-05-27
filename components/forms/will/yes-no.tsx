"use client";

import { Button } from "@/components/ui/button";

export function YesNo({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={label ?? "Yes or no"}>
      <Button
        type="button"
        size="sm"
        variant={value ? "default" : "outline"}
        role="radio"
        aria-checked={value === true}
        onClick={() => onChange(true)}
      >
        Yes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={!value ? "default" : "outline"}
        role="radio"
        aria-checked={value === false}
        onClick={() => onChange(false)}
      >
        No
      </Button>
    </div>
  );
}
