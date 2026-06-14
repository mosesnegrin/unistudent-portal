"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { allowedDomainMessage, isEmailAllowedForUniversity } from "@/lib/email-domain";
import type { University } from "@/lib/types";
import { PrimaryButton } from "@/components/ui";

type AuthMode = "login" | "signup";

export function LoginForm({ universities }: { universities: University[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedUniversity = useMemo(
    () => universities.find((university) => university.id === universityId),
    [universities, universityId]
  );

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

    router.replace(roles.some((role) => role === "super_admin" || role === "university_admin") ? "/admin" : "/dashboard");
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedUniversity) {
      setError("Choose your university first.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmailAllowedForUniversity(normalizedEmail, selectedUniversity)) {
      setError(allowedDomainMessage(selectedUniversity));
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
        setError(signInError.message);
        return;
      }

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
          university_id: selectedUniversity.id
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
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            email: normalizedEmail,
            university_id: selectedUniversity.id
          })
          .eq("id", user.id);
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
      <label className="block">
        <span className="text-sm font-medium">University</span>
        <select
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
          required
        >
          <option value="">Select university</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
              {university.name}
            </option>
          ))}
        </select>
      </label>
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
        <span className="text-sm font-medium">University email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
          placeholder={selectedUniversity ? `name@${selectedUniversity.allowed_email_domain}` : "name@university.ac.at"}
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
