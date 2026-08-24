"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Card } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth" ? "Sign-in link was invalid or expired. Try again." : null
  );
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const getClient = () => {
    try {
      return getSupabaseBrowserClient();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Supabase is not configured.");
      return null;
    }
  };

  const handlePasswordSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getClient();
    if (!supabase) return;

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      router.push("/invoices");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setError(null);
    const supabase = getClient();
    if (!supabase) return;
    if (!email) {
      setError("Enter your email first, then tap the magic-link button.");
      return;
    }

    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (otpError) throw new Error(otpError.message);
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-h3 text-ink font-semibold">Invoice Nudge</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card elevated className="w-full max-w-md p-8">
          <h1 className="text-h2 text-ink mb-2">Sign in</h1>
          <p className="text-body text-ink-muted mb-6">
            Sign in to upload invoices and keep your reminders.
          </p>

          {magicLinkSent ? (
            <div className="space-y-4" role="status">
              <div className="p-3 bg-success-soft border border-success rounded-lg text-body-sm text-success">
                Check your inbox — a sign-in link is on its way to {email}.
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setMagicLinkSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-danger-soft border border-danger rounded-lg text-body-sm text-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordSignIn} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <Button type="submit" className="w-full" loading={loading}>
                  Sign in with password
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-caption text-ink-muted" aria-hidden="true">
                <span className="flex-1 h-px bg-border" />
                or
                <span className="flex-1 h-px bg-border" />
              </div>

              <Button variant="secondary" className="w-full" onClick={handleMagicLink} disabled={loading}>
                Email me a magic link
              </Button>
              <p className="helper-text mt-3">No password needed — we send a one-time sign-in link.</p>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <LoginContent />
    </Suspense>
  );
}
