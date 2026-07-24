"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/app-shell/logo";
import { env } from "@/config/env";
import { buildAuthCallbackUrl } from "@/features/auth/oauth-redirect";
import { createClient } from "@/lib/supabase/client";

type AuthFeedback = { message: string; type: "error" | "success" };

type SupabaseErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

function reportAuthError(operation: string, error: SupabaseErrorLike) {
  console.warn(`Supabase ${operation} failed`, {
    code: error.code ?? "unknown",
    status: error.status ?? "unknown",
  });
}

function getSignupErrorMessage(error: SupabaseErrorLike) {
  const code = error.code?.toLowerCase() ?? "";
  const message = error.message?.toLowerCase() ?? "";
  if (
    code.includes("already_exists") ||
    code.includes("email_exists") ||
    message.includes("already registered")
  ) {
    return "If an account can be created for that email, check your inbox for next steps.";
  }
  if (error.status === 429 || code.includes("rate") || message.includes("rate limit")) {
    return "Too many sign-up attempts. Please wait a few minutes and try again.";
  }
  if (code.includes("email") || message.includes("valid email")) {
    return "Enter a valid email address and try again.";
  }
  if (code.includes("weak_password") || message.includes("password")) {
    return "Choose a stronger password and try again.";
  }
  if (code.includes("signup") || message.includes("signups not allowed")) {
    return "Email sign-up is not available right now. Please try again later.";
  }
  return "We could not create your account. Please try again.";
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const callbackError = params.get("error");
  const [feedback, setFeedback] = useState<AuthFeedback | undefined>(
    callbackError === "cancelled"
      ? { type: "error", message: "Google sign-in was cancelled." }
      : callbackError === "oauth"
        ? {
            type: "error",
            message: "Google sign-in could not be completed. Please try again.",
          }
        : undefined,
  );
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "sign-up";
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  async function emailAuth(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFeedback(undefined);
    try {
      const supabase = createClient();
      const result = isSignup
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: buildAuthCallbackUrl({
                fallbackAppUrl: env.NEXT_PUBLIC_APP_URL,
                next,
              }),
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        reportAuthError(isSignup ? "sign-up" : "sign-in", result.error);
        setFeedback({
          type: "error",
          message: isSignup
            ? getSignupErrorMessage(result.error)
            : "We could not sign you in. Check your email and password and try again.",
        });
        return;
      }
      if (isSignup) {
        const isObfuscatedExistingUser = result.data.user?.identities?.length === 0;
        if (!result.data.user || isObfuscatedExistingUser) {
          // Keep Supabase's account-enumeration protection intact.
          setFeedback({
            type: "success",
            message:
              "If an account can be created for that email, check your inbox for next steps.",
          });
          return;
        }
        if (!result.data.session) {
          setFeedback({
            type: "success",
            message: "Check your email to confirm your account, then sign in.",
          });
          return;
        }
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      const safeError = error as SupabaseErrorLike;
      reportAuthError(isSignup ? "sign-up" : "sign-in", safeError);
      setFeedback({
        type: "error",
        message: isSignup
          ? "We could not reach the sign-up service. Please try again."
          : "We could not sign you in. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function googleAuth() {
    setBusy(true);
    setFeedback(undefined);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAuthCallbackUrl({
            browserOrigin: window.location.origin,
            fallbackAppUrl: env.NEXT_PUBLIC_APP_URL,
            next,
          }),
        },
      });
      if (!error) return;
      reportAuthError("Google OAuth", error);
      setBusy(false);
      setFeedback({
        type: "error",
        message: "Google sign-in could not be started. Please try again.",
      });
    } catch (error) {
      reportAuthError("Google OAuth", error as SupabaseErrorLike);
      setBusy(false);
      setFeedback({
        type: "error",
        message: "Google sign-in could not be started. Please try again.",
      });
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#090a0d] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/[0.09] bg-[#111217] p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="mb-8">
          <Logo />
          <p className="mt-8 text-xs font-bold tracking-[0.14em] text-lime-300 uppercase">
            Your training space
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">
            {isSignup ? "Start your flow." : "Welcome back."}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {isSignup
              ? "Create your GymFlow account."
              : "Sign in to continue your training."}
          </p>
        </div>
        <button
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-lime-300 px-4 py-3 font-bold text-zinc-950 transition hover:bg-lime-200 disabled:opacity-60"
          disabled={busy}
          onClick={googleAuth}
          type="button"
        >
          <span className="grid size-5 place-items-center rounded-full bg-white text-xs font-black text-zinc-700">
            G
          </span>
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
          <span className="h-px flex-1 bg-white/[0.08]" />
          or continue with email
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>
        <form className="space-y-4" onSubmit={emailAuth}>
          <label className="block text-sm font-semibold text-zinc-200">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 font-normal text-white outline-none focus:border-lime-300"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-200">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0d0e12] px-3.5 py-3 font-normal text-white outline-none focus:border-lime-300"
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {feedback ? (
            <p
              className={`text-sm ${feedback.type === "success" ? "text-lime-300" : "text-red-300"}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              {feedback.message}
            </p>
          ) : null}
          <button
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-4 py-3 font-bold text-white hover:bg-white/[0.1] disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          {isSignup ? "Already have an account?" : "New to GymFlow?"}{" "}
          <Link
            className="font-semibold text-lime-300"
            href={isSignup ? "/auth/sign-in" : "/auth/sign-up"}
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}
