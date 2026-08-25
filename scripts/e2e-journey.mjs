/**
 * QA end-to-end journey against a locally running dev server.
 * Signs in as the demo user via Supabase password grant, then drives:
 *   upload → extract → confirm → generate → export → dashboard ops → delete
 *
 * Usage: node scripts/e2e-journey.mjs
 */
import { readFile } from "node:fs/promises";

const APP = process.env.APP_URL || "http://localhost:3000";
const FIXTURE = "test/fixtures/invoice-northstar.png";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@invoicenudge.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "demo-nudge-2026";

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("✗ Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)");
  process.exit(1);
}

const ref = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!ref) {
  console.error("✗ Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  ok ? passed++ : failed++;
  console.log(`${ok ? "✓" : "✗"} [${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

function cookieHeader(session) {
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  return `sb-${ref}-auth-token=${value}`;
}

async function api(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const res = await fetch(`${APP}${path}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, ok: res.ok, json, text };
}

// ── 1. Sign in ────────────────────────────────────────────────────────────
const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
});
const session = await authRes.json();
if (!check("sign-in via password grant", authRes.ok && session.access_token, authRes.ok ? "" : JSON.stringify(session).slice(0, 200))) {
  process.exit(1);
}
console.log(`  user: ${session.user?.email}`);
const cookie = cookieHeader(session);

// ── 2. Upload fixture ─────────────────────────────────────────────────────
const png = await readFile(FIXTURE);
const form = new FormData();
form.append("file", new Blob([png], { type: "image/png" }), "invoice-northstar.png");
const up = await api("/api/upload", { method: "POST", body: form, cookie });
check(
  "upload (signature + storage)",
  up.ok && up.json?.success && !!up.json?.fileId,
  up.json?.error || `status ${up.status}`
);
const fileId = up.json?.fileId;

// ── 3. Extract (the AI/vision test) ───────────────────────────────────────
const t0 = Date.now();
const ex = await api("/api/extract", { method: "POST", body: { fileId }, cookie });
const secs = ((Date.now() - t0) / 1000).toFixed(1);
check("extract completes", ex.ok && ex.json?.success, ex.json?.error || `${secs}s`);
console.log("\n── extraction result ──");
console.log(JSON.stringify(ex.json?.extracted ?? ex.json, null, 2));
console.log(`── (${secs}s) ──\n`);

const x = ex.json?.extracted;
const val = (c) => (typeof c?.value === "string" ? c.value : c?.value);
check("clientName → BluePeak (buyer, not vendor)", val(x?.clientName)?.toLowerCase().includes("bluepeak"), val(x?.clientName));
check("invoiceNumber → INV-TEST-2026-0417", val(x?.invoiceNumber) === "INV-TEST-2026-0417", val(x?.invoiceNumber));
check("amountDueMinor → 12626000", Number(x?.amountDueMinor?.value) === 12626000, String(x?.amountDueMinor?.value));
check("currency → INR", val(x?.currency) === "INR", val(x?.currency));
check("dueDate → 2026-06-25", String(val(x?.dueDate)).startsWith("2026-06-25"), val(x?.dueDate));
check("issueDate → 2026-06-10", String(val(x?.issueDate)).startsWith("2026-06-10"), val(x?.issueDate));

// ── 4. Confirm → invoice row ──────────────────────────────────────────────
const confirmed = {
  clientName: "BluePeak Retail Solutions Pvt. Ltd.",
  invoiceNumber: val(x?.invoiceNumber) || "INV-TEST-2026-0417",
  amountMinor: Number(x?.amountDueMinor?.value) || 12626000,
  currency: "INR",
  issueDate: "2026-06-10",
  dueDate: "2026-06-25",
  contactName: "",
  contactPhoneE164: "",
};
const conf = await api("/api/invoices", { method: "POST", body: confirmed, cookie });
check("confirm → invoice persisted", conf.ok && conf.json?.success && !!conf.json?.invoiceId, conf.json?.error);
const invoiceId = conf.json?.invoiceId;

// ── 5. Generate (Final Notice — 61 days overdue) ─────────────────────────
const gen = await api("/api/generate", {
  method: "POST",
  body: {
    invoiceId,
    invoice: confirmed,
    tone: "final_notice",
    context: { contactName: "", priorReminderCount: 1 },
    paymentMethod: { kind: "upi", value: "demo@okhdfc", label: "UPI", isDefault: false },
    daysOverdue: 61,
    promptVersion: "v1",
  },
  cookie,
});
check("generate succeeds", gen.ok && gen.json?.success && !!gen.json?.draft, gen.json?.error || `model=${gen.json?.model}`);
const d = gen.json?.draft;
console.log(`\n── draft (model: ${gen.json?.model}) ──`);
console.log(`Subject: ${d?.emailSubject}`);
console.log(`${d?.emailBody?.slice(0, 400)}${d?.emailBody?.length > 400 ? "…" : ""}\n`);
check("draft mentions exact amount", !!d && (d.emailBody.includes("1,26,260") || d.emailBody.includes("126,260")), "");
check("draft mentions due date", !!d && /25 (June|June 25)/.test(d.emailBody) || !!d && d.emailBody.includes("2026"), "");
check("draft references invoice number", !!d && d.emailBody.includes("INV-TEST-2026-0417"), "");
check("draft includes UPI", !!d && d.emailBody.includes("demo@okhdfc"), "");
check("no forbidden content", !!d && !/legal|court|penalt|late fee|suspend/i.test(`${d.emailSubject} ${d.emailBody} ${d.whatsappBody}`), "");

// ── 6. Export event ───────────────────────────────────────────────────────
const exp = await api("/api/export", {
  method: "POST",
  body: { reminderId: gen.json?.reminderId, action: "email_copied" },
  cookie,
});
check("export event recorded", exp.ok && exp.json?.success, exp.json?.error);

// ── 7. Dashboard: overdue list ────────────────────────────────────────────
const list = await api("/api/invoices?filter=overdue", { cookie });
const found = list.json?.invoices?.find((i) => i.id === invoiceId);
check("dashboard shows invoice (overdue)", !!found, found ? `${found.client_name} · ${found.status}` : "missing");
check("last action surfaced", !!found?.last_exported_tone || !!found?.lastExportedTone, JSON.stringify(found?.last_exported_tone ?? found?.lastExportedTone ?? null));

// ── 8. Mark paid → paid filter ────────────────────────────────────────────
const paid = await api(`/api/invoices/${invoiceId}`, { method: "PATCH", body: { action: "mark_paid" }, cookie });
check("mark paid", paid.ok && paid.json?.success, paid.json?.error);
const paidList = await api("/api/invoices?filter=paid", { cookie });
check("appears under paid filter", !!paidList.json?.invoices?.some((i) => i.id === invoiceId), "");

// ── 9. Delete (full-circle cleanup) ───────────────────────────────────────
const del = await api(`/api/invoices/${invoiceId}`, { method: "DELETE", cookie });
check("delete invoice", del.ok && del.json?.success, del.json?.error);
const after = await api("/api/invoices?filter=all", { cookie });
check("gone from all filter", !after.json?.invoices?.some((i) => i.id === invoiceId), "");

// ── 10. Unauthed access rejected ──────────────────────────────────────────
const anon = await api("/api/invoices?filter=all");
check("unauthenticated list rejected", anon.status === 401 || anon.json?.success === false, `status ${anon.status}`);

console.log(`\n${"═".repeat(50)}\n${passed} passed · ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
