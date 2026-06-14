"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { deleteContent } from "@/app/actions";

export function ConfirmDeleteButton({
  table,
  id,
  label
}: {
  table: string;
  id: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteContent(table, id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 hover:bg-rose-100"
      >
        <Trash2 size={15} />
        Delete
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Delete item</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Delete “{label}”? This cannot be undone.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="focus-ring grid size-9 place-items-center rounded-lg border border-line">
                <X size={16} />
              </button>
            </div>
            {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="focus-ring min-h-10 rounded-lg border border-line px-3 text-sm font-medium">
                Cancel
              </button>
              <button type="button" onClick={confirm} disabled={pending} className="focus-ring min-h-10 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white disabled:opacity-60">
                {pending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
