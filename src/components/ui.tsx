import Link from "next/link";
import type { ReactNode } from "react";
import { formatCategoryLabel } from "@/lib/format";

export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center shadow-sm">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
  className = ""
}: {
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-4 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex min-h-10 items-center justify-center rounded-xl border border-line bg-white px-3 text-sm font-medium shadow-sm transition hover:bg-surface"
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm shadow-sm"
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  required = false,
  placeholder,
  defaultValue
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        rows={4}
        className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm shadow-sm"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  children,
  required = false,
  defaultValue
}: {
  label: string;
  name: string;
  children: ReactNode;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line bg-white px-3 text-sm shadow-sm"
      >
        {children}
      </select>
    </label>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : value === "rejected"
        ? "bg-rose-50 text-rose-700"
        : value === "flagged"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{formatCategoryLabel(value)}</span>;
}
