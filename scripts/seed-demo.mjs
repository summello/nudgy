/**
 * Seeds a shareable demo account with sample invoices.
 *
 * Usage (Node 20.6+):
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * (service role is required to create auth users and bypass RLS).
 *
 * Idempotent: re-running skips if the demo user already has invoices.
 */
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@invoicenudge.app";
const DEMO_PASSWORD = "demo-nudge-2026";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "  Add them to .env.local (see .env.example) and re-run."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** ISO date N days from today (negative = past). */
function isoOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateDemoUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Demo Freelancer" },
  });

  if (!error && data.user) {
    console.log(`✓ Created demo user ${DEMO_EMAIL}`);
    return data.user.id;
  }

  if (!String(error?.message || "").toLowerCase().includes("already")) {
    throw error;
  }

  // Existing user — locate their id.
  let page = 1;
  for (;;) {
    const { data: res, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (listError) throw listError;
    const hit = res.users.find((u) => u.email === DEMO_EMAIL);
    if (hit) {
      console.log(`✓ Demo user ${DEMO_EMAIL} already exists`);
      return hit.id;
    }
    if (res.users.length < 200) break;
    page += 1;
  }
  throw new Error("Demo user exists but could not be located.");
}

async function main() {
  const userId = await getOrCreateDemoUser();

  const { data: existing, error: existingError } = await admin
    .from("invoices")
    .select("id", { count: "exact" })
    .eq("owner_id", userId);

  if (existingError) throw existingError;
  if ((existing?.length ?? 0) > 0) {
    console.log("• Demo invoices already present — nothing to seed.");
    console.log(`\nLogin: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
    return;
  }

  const { data: inserted, error: insertError } = await admin
    .from("invoices")
    .insert([
      {
        owner_id: userId,
        client_name: "Acme Design Studio",
        contact_name: "Priya Sharma",
        contact_phone_e164: "+919876543210",
        invoice_number: "INV-2026-001",
        amount_minor: 4850000,
        currency: "INR",
        issue_date: isoOffset(-45),
        due_date: isoOffset(-15),
        status: "overdue",
        confirmed_at: new Date().toISOString(),
      },
      {
        owner_id: userId,
        client_name: "TechStart Labs",
        contact_name: "Rahul Patel",
        contact_phone_e164: "+919876543211",
        invoice_number: "INV-2026-002",
        amount_minor: 7500000,
        currency: "INR",
        issue_date: isoOffset(-40),
        due_date: isoOffset(-5),
        status: "overdue",
        confirmed_at: new Date().toISOString(),
      },
      {
        owner_id: userId,
        client_name: "Mehta & Associates",
        contact_name: null,
        contact_phone_e164: null,
        invoice_number: "INV-2026-003",
        amount_minor: 3200000,
        currency: "INR",
        issue_date: isoOffset(-70),
        due_date: isoOffset(-32),
        status: "overdue",
        confirmed_at: new Date().toISOString(),
      },
      {
        owner_id: userId,
        client_name: "Creative Agency Co",
        contact_name: "Anjali Mehta",
        contact_phone_e164: "+919876543212",
        invoice_number: "INV-2026-000",
        amount_minor: 12000000,
        currency: "INR",
        issue_date: isoOffset(-75),
        due_date: isoOffset(-45),
        status: "paid",
        confirmed_at: new Date(Date.now() - 50 * 864e5).toISOString(),
        paid_at: new Date(Date.now() - 40 * 864e5).toISOString(),
      },
    ])
    .select("id, invoice_number");

  if (insertError) throw insertError;

  // Give the oldest invoice a reminder history so the dashboard shows a
  // "Last action" entry.
  const chased = inserted.find((i) => i.invoice_number === "INV-2026-001");
  if (chased) {
    const { data: reminder, error: reminderError } = await admin
      .from("reminders")
      .insert({
        invoice_id: chased.id,
        owner_id: userId,
        version: 1,
        tone: "firm",
        email_subject: "Overdue: invoice #INV-2026-001",
        email_body:
          "Hi Priya,\n\nThis is a reminder that invoice #INV-2026-001 was due recently. Please confirm when payment will be made.\n\nThanks,\nDemo Freelancer",
        whatsapp_body:
          "Hi Priya, reminder: invoice #INV-2026-001 is overdue. Please confirm when payment will be made.",
        context: { priorReminderCount: 0 },
        generation_model: "seed",
        prompt_version: "v1",
        validation_status: "valid",
      })
      .select("id")
      .single();

    if (!reminderError && reminder) {
      const openedAt = new Date(Date.now() - 6 * 864e5).toISOString();
      const copiedAt = new Date(Date.now() - 1 * 864e5).toISOString();
      await admin.from("reminder_exports").insert([
        { reminder_id: reminder.id, owner_id: userId, action: "whatsapp_opened", created_at: openedAt },
        { reminder_id: reminder.id, owner_id: userId, action: "email_copied", created_at: copiedAt },
      ]);
    }
  }

  console.log(`✓ Seeded ${inserted.length} invoices:`);
  for (const inv of inserted) {
    console.log(`   • ${inv.invoice_number}`);
  }
  console.log(`\nLogin: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);
}

main().catch((err) => {
  console.error("✗ Seed failed:", err.message ?? err);
  process.exit(1);
});
