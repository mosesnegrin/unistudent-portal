import { requireAdmin } from "@/lib/auth";
import { formatEuro } from "@/lib/money";
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

export default async function AdminLessonsPage() {
  const { profile, roles } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("lessons")
    .select("id,course_name,description,tutor_name,price_cents,session_type,moderation_status,auto_delete_at,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data, error } = await query;
  return (
    <>
      <PageHeader title="Private lessons moderation" description="Review every submitted private lesson." />
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p> : (
        <ManagementTable
          title="Lessons"
          table="lessons"
          items={(data ?? []) as Array<Record<string, unknown>>}
          columns={[
            { key: "course_name", label: "Course/name" },
            { key: "description", label: "Description" },
            { key: "tutor", label: "Tutor/created by", render: (item) => String(item.tutor_name ?? (provider(item, "full_name") || provider(item, "email"))) },
            { key: "created_by_email", label: "Created by email", render: (item) => provider(item, "email") },
            { key: "price_cents", label: "Price/free", render: (item) => formatEuro(item.price_cents as string | number | null) },
            { key: "session_type", label: "Session type" },
            { key: "university", label: "University", render: university }
          ]}
        />
      )}
    </>
  );
}
