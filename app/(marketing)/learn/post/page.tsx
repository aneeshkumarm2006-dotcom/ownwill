import { ArrowLeft } from "lucide-react";
import { Alert, Badge, Button } from "@/components/ui-kit";
import { FinalCta } from "@/components/marketing/final-cta";

export default function LearnPostPage() {
  return (
    <>
      <article className="py-20">
        <div className="container" style={{ maxWidth: 680 }}>
          <Button variant="link" href="/learn" icon={<ArrowLeft size={16} />}>All articles</Button>
          <Badge variant="info" className="mt-4">Wills 101</Badge>
          <h1 className="t-h1 mt-4">Choosing an executor: a short, kind guide</h1>
          <div className="t-body-sm muted mt-2">5 min read · Updated May 2026</div>
          <div className="mt-8" style={{ height: 280, background: "var(--muted)", borderRadius: 14 }} />
          <div className="t-body-lg mt-8 stack g-4" style={{ textWrap: "pretty" }}>
            <p>Your executor is the person who steps in after you&apos;re gone and does the work of carrying out your will. It&apos;s part HR manager, part bookkeeper, part diplomat — and it&apos;s the single most important choice in your will.</p>
            <p>Most people pick their spouse, an adult child, or a close friend. That&apos;s usually fine. What matters more than the relationship is whether the person is <strong>organized, available, and on speaking terms with the people in your will</strong>.</p>
            <h2 className="t-h3 mt-6">Three questions to ask</h2>
            <ul className="stack g-2">
              <li>Will they outlive you? (Backup executor: always.)</li>
              <li>Do they live in the same province? Cross-border executors get complicated.</li>
              <li>Can they read a bank statement without crying?</li>
            </ul>
            <Alert variant="info" title="Practical tip">Pick a backup executor. Even if your first choice is perfect, life is uncertain — and probate moves slowly without one.</Alert>
            <p>Once you&apos;ve decided, tell them. Don&apos;t make it a surprise from the grave.</p>
          </div>
          <div className="mt-12 row g-3" style={{ flexWrap: "wrap" }}>
            <span className="t-body-sm">Related:</span>
            <Button variant="link" href="/learn">What makes a will legally valid?</Button>
            <Button variant="link" href="/learn">Who should be your child&apos;s guardian?</Button>
          </div>
        </div>
      </article>
      <FinalCta />
    </>
  );
}
