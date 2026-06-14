import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { formatCategoryLabel } from "@/lib/format";

export function SubNav({ items, active }: { items: Array<{ href: string; label: string }>; active: string }) {
  return (
    <nav className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-line bg-white/90 p-1.5 shadow-sm">
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

export function CategoryFilter({
  basePath,
  categories,
  activeCategory,
  activeTab
}: {
  basePath: string;
  categories: string[];
  activeCategory?: string;
  activeTab?: string;
}) {
  const uniqueCategories = Array.from(new Set(categories.filter(Boolean)));
  if (!uniqueCategories.length) return null;

  function hrefFor(category?: string) {
    const params = new URLSearchParams();
    if (activeTab && activeTab !== "all") params.set("tab", activeTab);
    if (category) params.set("category", category);
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto">
      <Link
        href={hrefFor()}
        className={`focus-ring inline-flex min-h-9 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition ${
          !activeCategory ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"
        }`}
      >
        <span className="self-center">All</span>
      </Link>
      {uniqueCategories.map((category) => (
        <Link
          key={category}
          href={hrefFor(category)}
          className={`focus-ring inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition ${
            activeCategory === category
              ? "border-ink bg-ink text-white shadow-sm"
              : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink"
          }`}
        >
          <CategoryIcon category={category} />
          {formatCategoryLabel(category)}
        </Link>
      ))}
    </nav>
  );
}
