"use client";

import { PersonFields } from "@/components/forms/will/person-fields";
import { useWillStore } from "@/store/will";

export function ExecutorStep() {
  const data = useWillStore((s) => s.data);
  const patch = useWillStore((s) => s.patch);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Executor</h3>
          <p className="text-sm text-muted-foreground">
            The person responsible for carrying out your will.
          </p>
        </div>
        <PersonFields
          value={data.executor}
          onChange={(executor) => patch({ executor })}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="font-medium">Backup executor</h3>
          <p className="text-sm text-muted-foreground">
            Steps in if your first choice is unable or unwilling to serve.
          </p>
        </div>
        <PersonFields
          value={data.backup_executor}
          onChange={(backup_executor) => patch({ backup_executor })}
        />
      </section>
    </div>
  );
}
