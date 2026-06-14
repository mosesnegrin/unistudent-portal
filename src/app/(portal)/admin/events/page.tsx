import { requireAdmin } from "@/lib/auth";
import { ManagementTable } from "@/components/admin";
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

export default async function AdminEventsPage() {
  const { profile, roles } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("events")
    .select("id,title,description,starts_at,location,price_cents,capacity,moderation_status,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data, error } = await query;
  return (
    <>
      <PageHeader title="Event management" description="Review every submitted event. Approved and rejected items stay visible here." />
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p> : (
        <ManagementTable
          title="Events"
          table="events"
          items={(data ?? []) as Array<Record<string, unknown>>}
          columns={[
            { key: "title", label: "Title/name" },
            { key: "description", label: "Description" },
            { key: "starts_at", label: "Date/time", render: (item) => item.starts_at ? new Date(String(item.starts_at)).toLocaleString() : "" },
            { key: "location", label: "Location" },
            { key: "created_by_name", label: "Created by", render: (item) => provider(item, "full_name") || provider(item, "email") },
            { key: "created_by_email", label: "Created by email", render: (item) => provider(item, "email") },
            { key: "price_cents", label: "Price/free", render: (item) => item.price_cents ? `EUR ${(Number(item.price_cents) / 100).toFixed(2)}` : "Free" },
            { key: "capacity", label: "Capacity" },
            { key: "university", label: "University", render: university }
          ]}
        />
      )}
    </>
  );
}
