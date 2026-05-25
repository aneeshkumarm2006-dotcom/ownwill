"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Field } from "@/components/forms/will/field";
import { RepeatableList } from "@/components/forms/will/repeatable-list";
import { YesNo } from "@/components/forms/will/yes-no";
import { PersonFields } from "@/components/forms/will/person-fields";
import { useWillStore } from "@/store/will";
import {
  emptyChild,
  emptyPerson,
  hasMinorChild,
  isMinor,
  type Child,
} from "@/types/will";

export function ChildrenStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);
  const [hasChildren, setHasChildren] = useState(data.children.length > 0);

  const toggle = (v: boolean) => {
    setHasChildren(v);
    if (!v) {
      patch({
        children: [],
        guardian: emptyPerson(),
        backup_guardian: emptyPerson(),
      });
    } else if (data.children.length === 0) {
      patch({ children: [emptyChild()] });
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Do you have children?">
        <YesNo value={hasChildren} onChange={toggle} />
      </Field>

      {hasChildren ? (
        <>
          <RepeatableList<Child>
            items={data.children}
            makeEmpty={emptyChild}
            onChange={(children) => patch({ children })}
            addLabel="Add child"
            renderItem={(item, update) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name">
                  <Input
                    value={item.name}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </Field>
                <Field
                  label="Date of birth"
                  hint={item.dob && isMinor(item.dob) ? "Minor" : undefined}
                >
                  <DatePicker value={item.dob} onChange={(v) => update({ dob: v })} />
                </Field>
              </div>
            )}
          />

          {hasMinorChild(data.children) ? (
            <div className="space-y-8 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Because you have minor children, name a guardian to care for
                them.
              </p>
              <section className="space-y-3">
                <h3 className="font-medium">Guardian</h3>
                <PersonFields
                  value={data.guardian}
                  onChange={(guardian) => patch({ guardian })}
                />
              </section>
              <section className="space-y-3">
                <h3 className="font-medium">Backup guardian</h3>
                <PersonFields
                  value={data.backup_guardian}
                  onChange={(backup_guardian) => patch({ backup_guardian })}
                />
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
