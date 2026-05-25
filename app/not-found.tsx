import { Button } from "@/components/ui-kit";
import { NotFoundGraphic } from "@/components/illustrations";

export default function NotFound() {
  return (
    <section className="py-24" style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <div className="container max-marketing" style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          <NotFoundGraphic />
        </div>
        <h1 className="t-h1">This page wandered off.</h1>
        <p className="t-body-lg muted mt-3">Let&apos;s get you back to something solid.</p>
        <div className="row g-3 mt-6" style={{ justifyContent: "center" }}>
          <Button href="/">Back home</Button>
          <Button variant="outline" href="/support">Get help</Button>
        </div>
      </div>
    </section>
  );
}
