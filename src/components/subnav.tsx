import Link from "next/link";

export function SubNav({ items, active }: { items: Array<{ href: string; label: string }>; active: string }) {
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto rounded-lg border border-line bg-white p-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`focus-ring whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
            item.href.includes(`tab=${active}`) || (active === "all" && !item.href.includes("tab="))
              ? "bg-ink text-white"
              : "text-muted hover:bg-surface hover:text-ink"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
