"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { moderateContent } from "@/app/actions";
import type { ModerationStatus } from "@/lib/types";

export function ModerationActionButton({
  table,
  id,
  status,
  children,
  tone = "approve"
}: {
  table: string;
  id: string;
  status: ModerationStatus;
  children: React.ReactNode;
  tone?: "approve" | "reject";
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set("table", table);
    formData.set("id", id);
    formData.set("status", status);

    startTransition(async () => {
      const result = await moderateContent(formData);
      if (!result.ok) {
        setError(result.error);
        return;
        }
        setMessage(status === "approved" ? "Approved successfully." : "Rejected successfully.");
        router.refresh();
      });
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className={`focus-ring min-h-9 rounded-lg px-3 text-sm font-medium text-white disabled:opacity-60 ${
          tone === "approve" ? "bg-emerald-600" : "bg-rose-600"
        }`}
      >
        {pending ? "Saving..." : children}
      </button>
      {message ? <span className="max-w-48 text-xs text-emerald-700">{message}</span> : null}
      {error ? <span className="max-w-48 text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
