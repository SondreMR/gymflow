"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.06]"
      disabled={busy}
      onClick={signOut}
      type="button"
    >
      <LogOut size={16} />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
