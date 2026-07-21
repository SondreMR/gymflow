"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signOut() {
    setBusy(true);
    setError("");
    const { error: signOutError } = await createClient().auth.signOut();
    if (signOutError) {
      setError("Unable to sign out. Please try again.");
      setBusy(false);
      return;
    }
    router.replace("/auth/sign-in");
    router.refresh();
  }
  return (
    <div>
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]"
        disabled={busy}
        onClick={signOut}
        type="button"
      >
        <LogOut size={16} />
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
