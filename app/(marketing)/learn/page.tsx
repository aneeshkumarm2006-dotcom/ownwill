"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Badge, Card, Input } from "@/components/ui-kit";
import { FinalCta } from "@/components/marketing/final-cta";

const CATS = ["All", "Wills 101", "Estate planning", "Family", "Provincial"];
const POSTS = [
  { cat: "Wills 101", title: "What makes a will legally valid in Canada?", excerpt: "Witnesses, capacity, signatures — the short list you actually need to know." },
  { cat: "Estate planning", title: "Choosing an executor: a short, kind guide", excerpt: "It's a job, not an honour. Here's how to choose someone who'll actually do it." },
  { cat: "Family", title: "Who should be your child's guardian?", excerpt: "The hardest decision in your will — and how to make it less hard." },
  { cat: "Provincial", title: "What's different about wills in BC?", excerpt: "BC quietly leads on e-signing. Here's what that means for you." },
  { cat: "Wills 101", title: "Codicil vs. new will: which do you need?", excerpt: "Spoiler: in most cases, you want a fresh will." },
  { cat: "Family", title: "Talking to your parents about their will", excerpt: "A 4-step script for a Thanksgiving you actually want to remember." },
];

export default function LearnIndexPage() {
  const [cat, setCat] = useState("All");
  return (
    <>
      <section className="py-20">
        <div className="container max-marketing">
          <span className="t-overline muted">Learn</span>
          <h1 className="t-h1 mt-2">Plain English about wills, executors, and the messy bits.</h1>
          <div className="row g-2 mt-6" style={{ flexWrap: "wrap" }}>
            {CATS.map((c) => (
              <button key={c} className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
            ))}
            <div style={{ marginLeft: "auto", maxWidth: 280, flex: "1 1 240px" }}>
              <Input leadingIcon={<Search size={16} />} placeholder="Search articles" />
            </div>
          </div>
          <div className="grid mt-6 g-4 learn-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {POSTS.filter((p) => cat === "All" || p.cat === cat).map((p, i) => (
              <Link key={i} href="/learn/post" style={{ textDecoration: "none", color: "inherit" }}>
                <Card interactive className="stack g-3" style={{ height: "100%" }}>
                  <div style={{ height: 140, borderRadius: 10, background: i % 2 ? "var(--teal-100)" : "var(--coral-100)" }} />
                  <Badge variant="info">{p.cat}</Badge>
                  <div className="t-h4">{p.title}</div>
                  <div className="t-body-sm muted" style={{ flex: 1 }}>{p.excerpt}</div>
                  <div className="row g-2 t-body-sm" style={{ color: "var(--primary)", fontWeight: 600 }}>Read <ArrowRight size={14} /></div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <FinalCta />
      <style>{`@media (max-width: 900px) { .learn-grid { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 560px) { .learn-grid { grid-template-columns: 1fr !important; } }`}</style>
    </>
  );
}
