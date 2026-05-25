"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/will/field";
import { RepeatableList } from "@/components/forms/will/repeatable-list";
import { YesNo } from "@/components/forms/will/yes-no";
import { PersonFields } from "@/components/forms/will/person-fields";
import { useWillStore } from "@/store/will";
import { emptyPet, emptyPerson, type Pet } from "@/types/will";

export function PetsStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);
  const [hasPets, setHasPets] = useState(data.pets.length > 0);

  const toggle = (v: boolean) => {
    setHasPets(v);
    if (!v) {
      patch({ pets: [], pet_guardian: emptyPerson(), pet_care_fund: null });
    } else if (data.pets.length === 0) {
      patch({ pets: [emptyPet()] });
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Do you have pets?">
        <YesNo value={hasPets} onChange={toggle} />
      </Field>

      {hasPets ? (
        <>
          <RepeatableList<Pet>
            items={data.pets}
            makeEmpty={emptyPet}
            onChange={(pets) => patch({ pets })}
            addLabel="Add pet"
            renderItem={(item, update) => (
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name">
                  <Input
                    value={item.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <Input
                    value={item.type}
                    onChange={(e) => update({ type: e.target.value })}
                    placeholder="Dog, cat…"
                  />
                </Field>
                <Field label="Breed (optional)">
                  <Input
                    value={item.breed}
                    onChange={(e) => update({ breed: e.target.value })}
                  />
                </Field>
              </div>
            )}
          />

          <div className="space-y-8 border-t pt-6">
            <section className="space-y-3">
              <h3 className="font-medium">Pet guardian</h3>
              <p className="text-sm text-muted-foreground">
                Who will care for your pets.
              </p>
              <PersonFields
                value={data.pet_guardian}
                onChange={(pet_guardian) => patch({ pet_guardian })}
              />
            </section>
            <Field
              label="Pet care fund (CAD, optional)"
              hint="An amount left to the guardian for your pets' care."
            >
              <Input
                type="number"
                min={0}
                value={data.pet_care_fund ?? ""}
                onChange={(e) =>
                  patch({
                    pet_care_fund: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </Field>
          </div>
        </>
      ) : null}
    </div>
  );
}
