import { requireAdmin } from "@/lib/auth";
import { ModerationTable } from "@/components/admin";
import { PageHeader } from "@/components/ui";

export default async function AdminEventsPage() {
  const { supabase, profile, roles } = await requireAdmin();
  let query = supabase.from("events").select("id,title,moderation_status,moderation_notes,flag_count").order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data } = await query;
  return <><PageHeader title="Event management" description="Approve, reject, edit in Supabase, or delete event records." /><ModerationTable title="Events" table="events" items={data ?? []} /></>;
}
