import { requireAdmin } from "@/lib/auth";
import { formatEuro } from "@/lib/money";
import { ManagementTable } from "@/components/admin";
import { CategoryLabel } from "@/components/category-icon";
import { PageHeader } from "@/components/ui";
import { createServiceRoleClient } from "@/lib/supabase/admin";

function provider(item: Record<string, unknown>, field: "full_name" | "email") {
  const profile = item.profiles as { full_name?: string | null; email?: string | null } | null;
  return profile?.[field] ?? "";
}

function university(item: Record<string, unknown>) {
  const row = item.universities as { name?: string | null } | null;
  return row?.name ?? "";
}

export default async function AdminMarketplacePage() {
  const { profile, isPlatformAdmin, effectiveUniversityId } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("marketplace_items")
    .select("id,title,description,price_cents,category,moderation_status,auto_delete_at,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  const universityFilter = isPlatformAdmin ? effectiveUniversityId : profile?.university_id;
  if (universityFilter) query = query.eq("university_id", universityFilter);
  const { data, error } = await query;
  return (
    <>
      <PageHeader title="Marketplace moderation" description="Review every submitted buy/sell post." />
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p> : (
        <ManagementTable
          title="Marketplace posts"
          table="marketplace_items"
          items={(data ?? []) as Array<Record<string, unknown>>}
          columns={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
            { key: "price_cents", label: "Price", render: (item) => formatEuro(item.price_cents as string | number | null) },
            { key: "category", label: "Category", render: (item) => <CategoryLabel category={String(item.category ?? "")} /> },
            { key: "created_by_name", label: "Created by", render: (item) => provider(item, "full_name") || provider(item, "email") },
            { key: "created_by_email", label: "Created by email", render: (item) => provider(item, "email") },
            { key: "university", label: "University", render: university }
          ]}
        />
      )}
    </>
  );
}
