/**
 * Generates a synthetic invoice PNG fixture (fictional parties, per docs policy)
 * mirroring the layout/data of the QA test invoice:
 *   Vendor: Northstar Digital Labs Pvt. Ltd. (Gurugram)
 *   Buyer:  BluePeak Retail Solutions Pvt. Ltd. (Mumbai)
 *   INV-TEST-2026-0417 · June 10 2026 → June 25 2026 · INR
 *   Amount due ₹1,26,260.00 (subtotal 1,07,000 + IGST 18% 19,260)
 *
 * Usage: node scripts/make-fixture.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const W = 1128;
const NAVY = "#1F3A5F";
const INK = "#1a1a1a";
const MUTED = "#444";

function row(y, label, value, valueColor = INK, bold = false) {
  const weight = bold ? "600" : "400";
  return `<text x="640" y="${y}" font-size="17" fill="${MUTED}">${label}</text>
  <text x="790" y="${y}" font-size="17" fill="${valueColor}" font-weight="${weight}">${value}</text>`;
}

const itemRow = (n, y, desc, qty, rate, amt) => `
  <line x1="60" y1="${y + 34}" x2="1068" y2="${y + 34}" stroke="#e5e7eb" stroke-width="1"/>
  <text x="75" y="${y + 24}" font-size="17" fill="${INK}">${n}</text>
  <text x="115" y="${y + 24}" font-size="17" fill="${INK}">${desc}</text>
  <text x="640" y="${y + 24}" font-size="17" fill="${INK}" text-anchor="end">${qty}</text>
  <text x="880" y="${y + 24}" font-size="17" fill="${INK}" text-anchor="end">${rate}</text>
  <text x="1055" y="${y + 24}" font-size="17" fill="${INK}" text-anchor="end">${amt}</text>`;

const svg = `<svg width="${W}" height="1400" xmlns="http://www.w3.org/2000/svg" font-family="Helvetica, Arial, sans-serif">
  <rect width="${W}" height="1400" fill="#ffffff"/>
  <text x="1050" y="52" font-size="19" font-weight="700" fill="#c62828" text-anchor="end">UNPAID / OVERDUE</text>
  <text x="60" y="105" font-size="34" font-weight="700" fill="${NAVY}" letter-spacing="1">NORTHSTAR</text>
  <text x="60" y="130" font-size="15" fill="${MUTED}" letter-spacing="2">DIGITAL LABS PVT. LTD.</text>
  <text x="1050" y="115" font-size="40" font-weight="700" fill="${NAVY}" text-anchor="end">INVOICE</text>
  <rect x="770" y="140" width="280" height="42" fill="${NAVY}"/>
  <text x="910" y="168" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle">INV-TEST-2026-0417</text>

  <text x="60" y="205" font-size="15" font-weight="700" fill="${NAVY}">Vendor / Seller</text>
  <text x="60" y="232" font-size="17" font-weight="600" fill="${INK}">Northstar Digital Labs Pvt. Ltd.</text>
  <text x="60" y="256" font-size="16" fill="${MUTED}">18 Meridian Business Park</text>
  <text x="60" y="280" font-size="16" fill="${MUTED}">Sector 44, Gurugram, Haryana 122003</text>
  <text x="60" y="304" font-size="16" fill="${MUTED}">India</text>
  <text x="60" y="328" font-size="16" fill="${MUTED}">GSTIN: 06AABCN4821T1ZX</text>
  <text x="60" y="352" font-size="16" fill="${MUTED}">Email: billing@northstar-test.example</text>

  ${row(232, "Invoice Date", "June 10, 2026")}
  ${row(280, "Due Date", "June 25, 2026", "#c62828")}
  ${row(328, "Terms", "Net 15")}
  ${row(376, "Service Period", "May 15 – May 31, 2026")}
  ${row(424, "Currency", "INR")}
  ${row(472, "Status", "Unpaid / Overdue", "#c62828")}

  <text x="60" y="435" font-size="15" font-weight="700" fill="${NAVY}">Buyer / Client</text>
  <text x="60" y="462" font-size="17" font-weight="600" fill="${INK}">BluePeak Retail Solutions Pvt. Ltd.</text>
  <text x="60" y="486" font-size="16" fill="${MUTED}">402 Summit Plaza</text>
  <text x="60" y="510" font-size="16" fill="${MUTED}">Andheri East, Mumbai,</text>
  <text x="60" y="534" font-size="16" fill="${MUTED}">Maharashtra 400069, India</text>
  <text x="60" y="558" font-size="16" fill="${MUTED}">GSTIN: 27AABCB7314K1ZT</text>
  <text x="60" y="582" font-size="16" fill="${MUTED}">Email: accounts@bluepeak-test.example</text>

  <rect x="60" y="620" width="1008" height="42" fill="${NAVY}"/>
  <text x="75" y="648" font-size="16" font-weight="700" fill="#ffffff">#</text>
  <text x="115" y="648" font-size="16" font-weight="700" fill="#ffffff">Service Description</text>
  <text x="640" y="648" font-size="16" font-weight="700" fill="#ffffff" text-anchor="end">Qty</text>
  <text x="880" y="648" font-size="16" font-weight="700" fill="#ffffff" text-anchor="end">Rate (INR)</text>
  <text x="1055" y="648" font-size="16" font-weight="700" fill="#ffffff" text-anchor="end">Amount (INR)</text>
  ${itemRow(1, 662, "SaaS Platform Integration &amp; Configuration", "1", "45,000.00", "45,000.00")}
  ${itemRow(2, 712, "Custom Analytics Dashboard Development", "1", "28,500.00", "28,500.00")}
  ${itemRow(3, 762, "API Integration &amp; Testing", "12 hrs", "1,750.00", "21,000.00")}
  ${itemRow(4, 812, "Production Deployment &amp; Technical Support", "1", "12,500.00", "12,500.00")}

  <line x1="620" y1="880" x2="1068" y2="880" stroke="#cbd5e1" stroke-width="1"/>
  ${row(905, "Subtotal", "1,07,000.00")}
  ${row(935, "IGST (18%)", "19,260.00")}
  ${row(965, "Total", "1,26,260.00", INK, true)}
  ${row(995, "Amount Paid", "0.00", "#c62828")}
  <rect x="620" y="1008" width="448" height="30" fill="#fdecea"/>
  <text x="640" y="1029" font-size="17" font-weight="700" fill="${INK}">Amount Due</text>
  <text x="1055" y="1029" font-size="17" font-weight="700" fill="#c62828" text-anchor="end">1,26,260.00</text>

  <rect x="60" y="1070" width="470" height="200" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="85" y="1105" font-size="16" font-weight="700" fill="${NAVY}">PAYMENT DETAILS</text>
  <text x="85" y="1135" font-size="15" fill="${MUTED}">Payment Method     :  Bank Transfer</text>
  <text x="85" y="1160" font-size="15" fill="${MUTED}">Account Name      :  Northstar Digital Labs Pvt. Ltd.</text>
  <text x="85" y="1185" font-size="15" fill="${MUTED}">Bank                       :  Example Test Bank</text>
  <text x="85" y="1210" font-size="15" fill="${MUTED}">Account Number  :  TEST-00018427</text>
  <text x="85" y="1235" font-size="15" fill="${MUTED}">IFSC                       :  TEST0000123</text>
  <text x="85" y="1258" font-size="12" font-style="italic" fill="#94a3b8">* This is test data for invoice processing purposes.</text>

  <rect x="560" y="1070" width="508" height="200" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="585" y="1105" font-size="16" font-weight="700" fill="${NAVY}">NOTES</text>
  <text x="585" y="1135" font-size="15" fill="${MUTED}">Payment is due within 15 days of the invoice date.</text>
  <text x="585" y="1165" font-size="15" fill="${MUTED}">Please reference invoice number</text>
  <text x="585" y="1192" font-size="15" font-weight="600" fill="#c62828">INV-TEST-2026-0417</text>
  <text x="585" y="1219" font-size="15" fill="${MUTED}">when making payment.</text>

  <text x="${W / 2}" y="1330" font-size="20" font-style="italic" fill="${NAVY}" text-anchor="middle">Thank you for your business!</text>
  <text x="${W / 2}" y="1365" font-size="13" fill="#94a3b8" text-anchor="middle">This is a system generated test invoice.</text>
</svg>`;

await mkdir("test/fixtures", { recursive: true });
await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile("test/fixtures/invoice-northstar.png");
const meta = await sharp("test/fixtures/invoice-northstar.png").metadata();
console.log(`✓ test/fixtures/invoice-northstar.png (${meta.width}x${meta.height})`);
