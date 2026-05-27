import { Compass } from "@/components/illustrations";
import { Card } from "@/components/ui-kit";

export function ComingSoon({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets?: string[];
}) {
  return (
    <Card className="stack g-4" style={{ textAlign: "center", alignItems: "center", padding: 48 }}>
      <div style={{ maxWidth: 200 }}><Compass /></div>
      <h2 className="t-h3" style={{ margin: 0 }}>{title}</h2>
      <p className="t-body muted" style={{ maxWidth: "52ch" }}>{description}</p>
      {bullets && bullets.length > 0 && (
        <ul className="stack g-2 t-body-sm" style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left", maxWidth: 420 }}>
          {bullets.map((b) => <li key={b}>· {b}</li>)}
        </ul>
      )}
    </Card>
  );
}
