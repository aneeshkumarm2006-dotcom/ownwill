import { PROVINCE_NAMES, type DocumentType, type Province } from "@/types";
import { beneficiaryTotal, hasPerson, personName, type WillForm } from "@/types/will";
import type { DocData } from "@/lib/docs/data";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const provName = (code: unknown) => PROVINCE_NAMES[(code as Province)] ?? "____________";

// ── flat-person helpers for POA data (DocData column maps) ──
function flatName(d: DocData, prefix: string) {
  return [d[`${prefix}_first_name`], d[`${prefix}_last_name`]].filter(Boolean).join(" ").trim();
}

export const DOCUMENT_TITLES: Record<DocumentType, { title: string; subtitlePrefix: string }> = {
  will: { title: "Last Will and Testament", subtitlePrefix: "of" },
  poa_health: { title: "Power of Attorney for Personal Care", subtitlePrefix: "of" },
  poa_property: { title: "Continuing Power of Attorney for Property", subtitlePrefix: "of" },
  asset_list: { title: "Asset & Information List", subtitlePrefix: "prepared by" },
};

const LEAF = `<svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M6 22c0-9 6-15 16-16 1 0 2 1 2 2 0 10-7 16-16 16-1 0-2-1-2-2z" fill="#0E4C49"/><path d="M9 21c4-1 8-3 11-6 1.6-1.6 3-3.6 4-6" stroke="#FF6B5C" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>`;

export const DOCUMENT_CSS = `
  *{box-sizing:border-box}
  .doc{ font-family: Georgia, "Times New Roman", serif; color:#1b2a28; background:#fff; line-height:1.75; max-width:720px; margin:0 auto; }
  .doc-letterhead{ text-align:center; padding-bottom:18px; border-bottom:2px solid #0E4C49; margin-bottom:26px; }
  .doc-brand{ font-family:Inter,Arial,sans-serif; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:.18em; color:#0E4C49; margin-top:6px; }
  .doc-title{ font-size:26px; font-weight:700; margin:14px 0 2px; letter-spacing:.01em; }
  .doc-subtitle{ font-style:italic; color:#5C6764; font-size:15px; }
  .doc-meta{ font-family:Inter,Arial,sans-serif; font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:#9aa39f; margin-top:10px; }
  .doc section{ margin:0 0 18px; page-break-inside:avoid; }
  .doc h2{ font-family:Inter,Arial,sans-serif; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#0E4C49; margin:22px 0 8px; }
  .doc p{ font-size:14.5px; margin:0 0 10px; }
  .doc ul{ margin:0 0 10px; padding-left:22px; }
  .doc li{ font-size:14.5px; margin-bottom:6px; }
  .doc .lede{ color:#3A4543; }
  .doc .blank{ color:#C0392B; font-style:italic; }
  .doc-sign{ margin-top:34px; }
  .doc-line{ border-bottom:1px solid #1b2a28; height:30px; }
  .doc-cap{ font-family:Inter,Arial,sans-serif; font-size:11px; color:#5C6764; margin-top:4px; }
  .doc-witnesses{ display:grid; grid-template-columns:1fr 1fr; gap:26px; margin-top:16px; }
  .doc-footer{ margin-top:34px; padding-top:14px; border-top:1px solid #E0D6C5; font-family:Inter,Arial,sans-serif; font-size:11px; color:#7A847F; text-align:center; }
  .doc-kv{ display:grid; grid-template-columns:160px 1fr; gap:6px 16px; font-size:14px; }
  .doc-kv dt{ font-family:Inter,Arial,sans-serif; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#7A847F; }
  .doc-kv dd{ margin:0; }
`;

function shell(title: string, subtitle: string, body: string): string {
  const date = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  return `<article class="doc">
    <div class="doc-letterhead">
      ${LEAF}
      <div class="doc-brand">OwnWill</div>
      <div class="doc-title">${esc(title)}</div>
      <div class="doc-subtitle">${esc(subtitle)}</div>
      <div class="doc-meta">Prepared ${date}</div>
    </div>
    ${body}
    <div class="doc-footer">Generated with OwnWill. OwnWill is not a law firm and does not provide legal advice. This document is only valid once signed according to your province's requirements.</div>
  </article>`;
}

function signingBlock(name: string, provinceName: string): string {
  return `<section class="doc-sign">
    <p>IN WITNESS WHEREOF I have signed this document at ____________, ${esc(provinceName)}, on this ______ day of ____________, 20____.</p>
    <div style="margin:22px 0"><div class="doc-line"></div><div class="doc-cap">${esc(name)} (Signatory)</div></div>
    <p style="font-size:13px;color:#3A4543">Signed in our presence, and by us in the presence of the signatory and each other, as witnesses:</p>
    <div class="doc-witnesses">
      <div><div class="doc-line"></div><div class="doc-cap">Witness 1 — name, address, signature</div></div>
      <div><div class="doc-line"></div><div class="doc-cap">Witness 2 — name, address, signature</div></div>
    </div>
  </section>`;
}

// ────────────────────────────── WILL ──────────────────────────────
function willBody(d: WillForm): string {
  const name = esc(d.full_legal_name) || "________________________";
  const pn = provName(d.province);
  const ex = d.executor, bk = d.backup_executor;
  const total = beneficiaryTotal(d.beneficiaries);
  const out: string[] = [];
  out.push(`<section><h2>1. Declaration</h2><p>I, <strong>${name}</strong>, of ${esc(d.city) || "____________"}, ${pn}, declare this to be my Last Will and Testament. I am of the age of majority and of sound mind, and I revoke all wills and codicils I have previously made.</p></section>`);
  out.push(`<section><h2>2. Executor</h2><p>I appoint <strong>${hasPerson(ex) ? esc(personName(ex)) : "________________________"}</strong> as the Executor and Trustee of my estate.${hasPerson(bk) ? ` Should they be unable or unwilling to act, I appoint <strong>${esc(personName(bk))}</strong> in their place.` : ""}</p></section>`);
  if (d.children.some((c) => c.name) && hasPerson(d.guardian)) {
    out.push(`<section><h2>3. Guardian</h2><p>If any of my children are minors at my death, I appoint <strong>${esc(personName(d.guardian))}</strong> as their Guardian${hasPerson(d.backup_guardian) ? `, or <strong>${esc(personName(d.backup_guardian))}</strong> if they cannot act` : ""}.</p></section>`);
  }
  if (d.specific_gifts.length) {
    out.push(`<section><h2>4. Specific Gifts</h2><ul>${d.specific_gifts.map((g) => `<li>I give my <strong>${esc(g.item) || "____"}</strong> to <strong>${esc(g.recipient_name) || "____"}</strong>${g.recipient_relationship ? ` (my ${esc(g.recipient_relationship)})` : ""}.</li>`).join("")}</ul></section>`);
  }
  if (d.pets.length && hasPerson(d.pet_guardian)) {
    out.push(`<section><h2>5. Care of Pets</h2><p>I give my pet(s) ${d.pets.map((p) => esc(p.name)).filter(Boolean).join(", ")} to <strong>${esc(personName(d.pet_guardian))}</strong>${d.pet_care_fund ? ` together with $${esc(d.pet_care_fund)} for their care` : ""}.</p></section>`);
  }
  const residue = d.beneficiaries.length
    ? `<ul>${d.beneficiaries.map((b) => `<li><strong>${esc(b.percentage)}%</strong> to <strong>${esc(b.name) || "____"}</strong>${b.relationship ? ` (my ${esc(b.relationship)})` : ""}.</li>`).join("")}</ul>${total !== 100 ? `<p class="blank">Shares currently total ${total}% (should equal 100%).</p>` : ""}`
    : `<p class="blank">[ No beneficiaries specified ]</p>`;
  out.push(`<section><h2>6. Residue of Estate</h2><p>I give the residue of my estate as follows:</p>${residue}</section>`);
  if (d.charitable_donations.length) {
    out.push(`<section><h2>7. Charitable Gifts</h2><ul>${d.charitable_donations.map((c) => `<li>${c.is_percentage ? `${esc(c.amount)}% of my estate` : `$${esc(c.amount)}`} to <strong>${esc(c.organization) || "____"}</strong>.</li>`).join("")}</ul></section>`);
  }
  if (d.funeral_wishes || d.business_interests) {
    out.push(`<section><h2>8. Final Wishes</h2>${d.funeral_wishes ? `<p>${esc(d.funeral_wishes)}</p>` : ""}${d.business_interests ? `<p>${esc(d.business_interests)}</p>` : ""}</section>`);
  }
  out.push(signingBlock(name, pn));
  return out.join("");
}

// ────────────────────────── POA — HEALTH ──────────────────────────
function poaHealthBody(d: DocData): string {
  const name = esc(d.full_legal_name) || "________________________";
  const pn = provName(d.province);
  const att = flatName(d, "attorney") || "________________________";
  const bk = flatName(d, "backup_attorney");
  const ls: Record<string, string> = { maintain: "I wish to be kept on life support.", remove: "I wish life support to be withdrawn if there is no reasonable expectation of recovery.", attorney_decides: "I leave decisions about life support to my attorney." };
  const out: string[] = [];
  out.push(`<section><h2>1. Appointment</h2><p>I, <strong>${name}</strong>, of ${pn}, appoint <strong>${esc(att)}</strong> to be my attorney for personal care and to make health and personal-care decisions on my behalf if I become incapable of making them myself.${bk ? ` If they are unable to act, I appoint <strong>${esc(bk)}</strong> in their place.` : ""}</p></section>`);
  out.push(`<section><h2>2. Authority</h2><p>My attorney may consent to, refuse, or withdraw consent to medical treatment, and may make decisions about my health care, nutrition, shelter, safety, and personal care, in accordance with my known wishes and best interests.</p></section>`);
  if (d.life_support_wishes) out.push(`<section><h2>3. Life Support</h2><p>${esc(ls[d.life_support_wishes as string] || "")}</p></section>`);
  out.push(`<section><h2>4. Organ Donation</h2><p>${d.organ_donation ? `I wish to donate my organs and tissues.${d.organ_donation_specifics ? ` ${esc(d.organ_donation_specifics)}` : ""}` : "I do not wish to donate my organs."}</p></section>`);
  if (d.additional_health_wishes) out.push(`<section><h2>5. Additional Wishes</h2><p>${esc(d.additional_health_wishes)}</p></section>`);
  out.push(`<section><h2>6. When This Takes Effect</h2><p>${d.activation_condition === "immediately" ? "This authority takes effect immediately upon signing." : "This authority takes effect only if I become mentally incapable of making my own personal-care decisions."}</p></section>`);
  out.push(signingBlock(name, pn));
  return out.join("");
}

// ───────────────────────── POA — PROPERTY ─────────────────────────
function poaPropertyBody(d: DocData): string {
  const name = esc(d.full_legal_name) || "________________________";
  const pn = provName(d.province);
  const att = flatName(d, "attorney") || "________________________";
  const bk = flatName(d, "backup_attorney");
  const powers: string[] = [];
  if (d.manage_bank_accounts) powers.push("operate my bank accounts");
  if (d.manage_real_estate) powers.push("buy, sell, and manage real estate");
  if (d.manage_investments) powers.push("manage my investments");
  if (d.manage_taxes) powers.push("file my taxes and deal with the CRA");
  if (d.make_gifts) powers.push(`make reasonable gifts${d.gift_limit_per_year ? ` up to $${esc(d.gift_limit_per_year)} per year` : ""}`);
  const comp: Record<string, string> = { no_compensation: "My attorney shall not be compensated.", reasonable_compensation: "My attorney may take reasonable compensation in accordance with provincial rates.", specific_amount: `My attorney may take compensation of $${esc(d.compensation_amount)}.` };
  const out: string[] = [];
  out.push(`<section><h2>1. Appointment</h2><p>I, <strong>${name}</strong>, of ${pn}, appoint <strong>${esc(att)}</strong> to be my attorney for property to manage my financial affairs.${bk ? ` If they are unable to act, I appoint <strong>${esc(bk)}</strong> in their place.` : ""}</p></section>`);
  out.push(`<section><h2>2. Powers Granted</h2>${powers.length ? `<p>My attorney is authorized to ${powers.join(", ")}.</p>` : `<p class="blank">[ No powers specified ]</p>`}${d.additional_powers ? `<p>${esc(d.additional_powers)}</p>` : ""}</section>`);
  if (d.restrictions) out.push(`<section><h2>3. Restrictions</h2><p>${esc(d.restrictions)}</p></section>`);
  out.push(`<section><h2>4. Compensation</h2><p>${esc(comp[d.attorney_compensation as string] || "")}</p></section>`);
  out.push(`<section><h2>5. When This Takes Effect</h2><p>${d.activation_condition === "immediately" ? "This authority takes effect immediately upon signing." : "This authority takes effect only upon my mental incapacity."}${d.requires_two_doctors_confirmation ? " Incapacity must be confirmed by two qualified medical practitioners." : ""}</p></section>`);
  out.push(signingBlock(name, pn));
  return out.join("");
}

// ─────────────────────────── ASSET LIST ───────────────────────────
function assetListBody(d: DocData, ownerName: string): string {
  const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as Record<string, unknown>[]) : []);
  const list = (k: string, fmt: (r: Record<string, unknown>) => string) => {
    const items = arr(k);
    return items.length ? `<ul>${items.map((r) => `<li>${fmt(r)}</li>`).join("")}</ul>` : `<p class="lede">None listed.</p>`;
  };
  const f = (v: unknown) => esc(v) || "—";
  const out: string[] = [];
  out.push(`<section><p class="lede">This is a reference for ${esc(ownerName) || "the owner"}'s executor and loved ones. It is not a legal document — it simply records what exists and where to find it.</p></section>`);
  out.push(`<section><h2>Real Property</h2>${list("properties", (r) => `${f(r.address)}${r.city ? `, ${f(r.city)}` : ""}${r.estimated_value ? ` — est. $${f(r.estimated_value)}` : ""}`)}</section>`);
  out.push(`<section><h2>Vehicles</h2>${list("vehicles", (r) => `${f(r.year)} ${f(r.make)} ${f(r.model)}${r.vin ? ` (VIN ${f(r.vin)})` : ""}`)}</section>`);
  out.push(`<section><h2>Bank Accounts</h2>${list("bank_accounts", (r) => `${f(r.bank_name)} — ${f(r.account_type)}${r.last_4_digits ? ` ••••${f(r.last_4_digits)}` : ""}`)}</section>`);
  out.push(`<section><h2>Investments</h2>${list("investments", (r) => `${f(r.institution)} — ${f(r.type)}${r.approximate_value ? ` — ~$${f(r.approximate_value)}` : ""}`)}</section>`);
  out.push(`<section><h2>Insurance Policies</h2>${list("insurance_policies", (r) => `${f(r.provider)} — ${f(r.type)}${r.policy_number ? ` (#${f(r.policy_number)})` : ""}${r.beneficiary ? ` → ${f(r.beneficiary)}` : ""}`)}</section>`);
  out.push(`<section><h2>Digital Assets</h2>${list("digital_assets", (r) => `${f(r.platform)} — ${f(r.type)}${r.notes ? ` — ${f(r.notes)}` : ""}`)}</section>`);
  out.push(`<section><h2>Document Locations</h2><dl class="doc-kv"><dt>Will</dt><dd>${f(d.will_location)}</dd><dt>Passport</dt><dd>${f(d.passport_location)}</dd><dt>SIN card</dt><dd>${f(d.sin_location)}</dd></dl></section>`);
  out.push(`<section><h2>Key Contacts</h2><dl class="doc-kv"><dt>Lawyer</dt><dd>${f(d.lawyer_name)} ${d.lawyer_phone ? `· ${f(d.lawyer_phone)}` : ""}</dd><dt>Accountant</dt><dd>${f(d.accountant_name)} ${d.accountant_phone ? `· ${f(d.accountant_phone)}` : ""}</dd><dt>Financial advisor</dt><dd>${f(d.financial_advisor_name)} ${d.financial_advisor_phone ? `· ${f(d.financial_advisor_phone)}` : ""}</dd></dl></section>`);
  return out.join("");
}

/** Renders a full document (letterhead + body + footer) as an HTML string. */
export function renderDocument(type: DocumentType, data: WillForm | DocData, ownerName = ""): string {
  const meta = DOCUMENT_TITLES[type] ?? { title: "Document", subtitlePrefix: "of" };
  const name = type === "will"
    ? (data as WillForm).full_legal_name || ownerName
    : ((data as DocData).full_legal_name as string) || ownerName;
  const subtitle = `${meta.subtitlePrefix} ${name || "________________________"}`;

  let body = "";
  if (type === "will") body = willBody(data as WillForm);
  else if (type === "poa_health") body = poaHealthBody(data as DocData);
  else if (type === "poa_property") body = poaPropertyBody(data as DocData);
  else if (type === "asset_list") body = assetListBody(data as DocData, ownerName);

  return shell(meta.title, subtitle, body);
}
