import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendMagicLink(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // After clicking the email link, come back to your app
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setMsg("✅ Check your email for the magic sign-in link.");
    } catch (err) {
      setMsg(`❌ ${err?.message || "Something went wrong."}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md border border-[var(--color-border)] bg-[var(--color-surface)] rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm opacity-80 mt-1">
          Enter your email and we’ll send you a login link.
        </p>

        <form onSubmit={sendMagicLink} className="mt-6 flex flex-col gap-3">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl px-4 py-3 font-medium bg-[var(--color-primary)] text-white disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>

          {msg && (
            <div className="text-sm mt-2 border border-[var(--color-border)] rounded-xl px-4 py-3">
              {msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}