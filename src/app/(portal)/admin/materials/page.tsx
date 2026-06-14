import { requireAdmin } from "@/lib/auth";
import { ModerationTable } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default async function AdminMaterialsPage() {
  const { supabase, profile, roles } = await requireAdmin();
  let query = supabase.from("materials").select("id,title,course_name,moderation_status,moderation_notes,flag_count").order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data } = await query;
  return <><PageHeader title="Materials moderation" description="Review uploaded notes and materials before students can see them." /><ModerationTable title="Materials" table="materials" items={data ?? []} /></>;
}
