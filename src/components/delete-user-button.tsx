"use client";

import { useState, useTransition } from "react";
import { Trash2, X } from "lucide-react";
import { deleteUser } from "@/app/actions";

export function DeleteUserButton({
  userId,
  userName,
  disabled = false
}: {
  userId: string;
  userName: string;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={16} />
        Delete
      </button>
      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Delete user</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This will remove {userName} from Supabase Auth and delete or detach related account data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="focus-ring grid size-9 place-items-center rounded-lg border border-line"
              >
                <X size={16} />
              </button>
            </div>
            {error ? <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="focus-ring min-h-10 rounded-lg border border-line px-3 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isPending}
                className="focus-ring min-h-10 rounded-lg bg-rose-600 px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
