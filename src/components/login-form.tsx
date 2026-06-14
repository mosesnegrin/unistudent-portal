"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { University } from "@/lib/types";
import { PrimaryButton } from "@/components/ui";

export function LoginForm({ universities }: { universities: University[] }) {
  const [universityId, setUniversityId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedUniversity = useMemo(
    () => universities.find((university) => university.id === universityId),
    [universities, universityId]
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!selectedUniversity) {
      setError("Choose your university first.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const domain = selectedUniversity.allowed_email_domain.toLowerCase();
    if (!normalizedEmail.endsWith(`@${domain}`)) {
      setError(`Use your ${domain} university email address.`);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName.trim(),
          university_id: selectedUniversity.id
        }
      }
    });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    setMessage("Check your email for the secure login link.");
  }

  return (
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
      <label className="block">
        <span className="text-sm font-medium">Full name</span>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-3 text-sm"
          required
        />
      </label>
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
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      <PrimaryButton className="w-full" type="submit">
        {isLoading ? "Sending..." : "Send login link"}
      </PrimaryButton>
    </form>
  );
}
