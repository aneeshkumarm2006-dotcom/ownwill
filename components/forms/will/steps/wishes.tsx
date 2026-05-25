"use client";

import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/will/field";
import { useWillStore } from "@/store/will";

export function WishesStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);

  return (
    <div className="space-y-4">
      <Field
        label="Funeral & burial wishes (optional)"
        hint="Any preferences for your funeral, burial, or cremation."
      >
        <Textarea
          value={data.funeral_wishes}
          onChange={(e) => patch({ funeral_wishes: e.target.value })}
          rows={4}
        />
      </Field>

      <Field
        label="Business interests (optional)"
        hint="Any businesses you own and how they should be handled."
      >
        <Textarea
          value={data.business_interests}
          onChange={(e) => patch({ business_interests: e.target.value })}
          rows={4}
        />
      </Field>
    </div>
  );
}
