import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Invoice Nudge — Turn overdue invoices into professional follow-ups",
  description: "Upload an unpaid invoice. Get the perfect follow-up in 10 seconds. Indian freelancers' tool for payment reminders with UPI, WhatsApp, and email drafts.",
  keywords: ["invoice", "freelancer", "payment reminder", "overdue", "UPI", "WhatsApp", "India"],
  authors: [{ name: "Invoice Nudge" }],
  creator: "Invoice Nudge",
  publisher: "Invoice Nudge",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://invoicenudge.app",
    title: "Invoice Nudge — Turn overdue invoices into professional follow-ups",
    description: "Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.",
    siteName: "Invoice Nudge",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoice Nudge",
    description: "Upload an unpaid invoice. Get the perfect follow-up in 10 seconds.",
  },
  verification: {
    google: "",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}