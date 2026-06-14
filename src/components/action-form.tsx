"use client";

import { useRef, useState, useTransition } from "react";

type ActionResult = void | { ok: true; message?: string } | { ok: false; error: string };

export function ActionForm({
  action,
  successMessage,
  resetOnSuccess = false,
  className,
  children
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  successMessage: string;
  resetOnSuccess?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result && "ok" in result && !result.ok) {
          setError(result.error);
          return;
        }
        setMessage(result && "ok" in result && result.message ? result.message : successMessage);
        if (resetOnSuccess) formRef.current?.reset();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className={className} aria-busy={pending}>
      {children}
      {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
