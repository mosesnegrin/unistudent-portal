"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { detectAuthTarget, finalizeAuthenticatedProfile } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import { PrimaryButton } from "@/components/ui";

type AuthMode = "login" | "signup";

const deactivatedUniversityMessage = "This university portal is currently deactivated. Please contact your university administrator or UniStudents support.";

const unregisteredUniversityMessage = (
  <>
    Your university is not registered yet. Please inform your administration or contact us at{" "}
    <a className="font-medium underline underline-offset-4" href="mailto:moysis.negrin@lbs.ac.at">
      moysis.negrin@lbs.ac.at
    </a>.
  </>
);

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function redirectByRole() {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", user.id);

    const roles = (roleRows ?? [])
      .map((item) => {
        const role = item.roles as unknown as { name?: string } | { name?: string }[] | null;
        return Array.isArray(role) ? role[0]?.name : role?.name;
      })
      .filter(Boolean);

    router.replace(roles.some((role) => role === "super_admin" || role === "university_admin" || role === "company") ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    const target = await detectAuthTarget(normalizedEmail);
    if (!target.ok) {
      setError(unregisteredUniversityMessage);
      return;
    }
    if (!target.isActive) {
      setError(deactivatedUniversityMessage);
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      setIsLoading(false);

      if (signInError) {
        setError("Invalid email or password.");
        return;
      }

      await finalizeAuthenticatedProfile();
      await redirectByRole();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          university_id: target.type === "company" ? null : target.universityId
        }
      }
    });

    if (signUpError) {
      setIsLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user) {
        await finalizeAuthenticatedProfile(fullName.trim());
      }

      setIsLoading(false);
      await redirectByRole();
      return;
    }

    setIsLoading(false);
    setMessage("Account created. Confirm your email before logging in, or turn off email confirmation in Supabase for instant login.");
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 rounded-lg bg-surface p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
            setMessage(null);
          }}
          className={`focus-ring min-h-10 rounded-lg text-sm font-medium transition ${mode === "login" ? "bg-white shadow-sm" : "text-muted"}`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
            setMessage(null);
          }}
          className={`focus-ring min-h-10 rounded-lg text-sm font-medium transition ${mode === "signup" ? "bg-white shadow-sm" : "text-muted"}`}
        >
          Sign up
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
      {mode === "signup" ? (
        <label className="block">
          <span className="text-sm font-medium">Full name</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
            required
          />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
          required
        />
      </label>
      {mode === "signup" ? (
        <label className="block">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
            required
          />
        </label>
      ) : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      <PrimaryButton className="w-full" type="submit">
        {isLoading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
      </PrimaryButton>
      </form>
    </div>
  );
}
