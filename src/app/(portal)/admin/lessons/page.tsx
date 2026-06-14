import { requireAdmin } from "@/lib/auth";
import { ModerationTable } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default async function AdminLessonsPage() {
  const { supabase, profile, roles } = await requireAdmin();
  let query = supabase.from("lessons").select("id,course_name,moderation_status,moderation_notes,flag_count").order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data } = await query;
  return <><PageHeader title="Private lessons moderation" description="Review private lesson listings." /><ModerationTable title="Lessons" table="lessons" items={data ?? []} /></>;
}
