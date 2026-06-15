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

export default async function AdminMaterialsPage() {
  const { profile, isPlatformAdmin, effectiveUniversityId } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("materials")
    .select("id,title,course_name,description,is_free,price_cents,file_path,moderation_status,auto_delete_at,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  const universityFilter = isPlatformAdmin ? effectiveUniversityId : profile?.university_id;
  if (universityFilter) query = query.eq("university_id", universityFilter);
  const { data, error } = await query;
  const filePaths = (data ?? []).map((item) => item.file_path).filter(Boolean) as string[];
  const signedUrls = new Map<string, string>();
  if (filePaths.length) {
    const { data: signed } = await adminClient.storage.from("materials").createSignedUrls(filePaths, 60 * 10);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }
  return (
    <>
      <PageHeader title="Materials moderation" description="Review every submitted note or material." />
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p> : (
        <ManagementTable
          title="Materials"
          table="materials"
          items={(data ?? []) as Array<Record<string, unknown>>}
          columns={[
            { key: "title", label: "Title" },
            { key: "course_name", label: "Course" },
            { key: "description", label: "Description" },
            { key: "created_by_name", label: "Created by", render: (item) => provider(item, "full_name") || provider(item, "email") },
            { key: "created_by_email", label: "Created by email", render: (item) => provider(item, "email") },
            { key: "price_cents", label: "Price/free", render: (item) => item.is_free ? "Free" : formatEuro(item.price_cents as string | number | null) },
            { key: "file", label: "File", render: (item) => item.file_path && signedUrls.get(String(item.file_path)) ? <a href={signedUrls.get(String(item.file_path))} target="_blank" rel="noreferrer" className="font-medium underline">Review file</a> : "No file" },
            { key: "university", label: "University", render: university }
          ]}
        />
      )}
    </>
  );
}
