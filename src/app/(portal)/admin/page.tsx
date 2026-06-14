import { requireAdmin } from "@/lib/auth";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";

export default async function AdminPage() {
  const { supabase, profile, roles } = await requireAdmin();
  const universityFilter = roles.includes("super_admin") ? undefined : profile?.university_id;

  const scoped = (table: string) => {
    const query = supabase.from(table).select("id", { count: "exact", head: true });
    return universityFilter ? query.eq("university_id", universityFilter) : query;
  };

  const [users, activeUsers, events, marketplace, pendingEvents, pendingLessons, pendingMaterials] = await Promise.all([
    universityFilter
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityFilter)
      : supabase.from("profiles").select("id", { count: "exact", head: true }),
    universityFilter
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("university_id", universityFilter).eq("is_active", true)
      : supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_active", true),
    scoped("events"),
    scoped("marketplace_items"),
    scoped("events").eq("moderation_status", "pending"),
    scoped("lessons").eq("moderation_status", "pending"),
    scoped("materials").eq("moderation_status", "pending")
  ]);

  const stats = [
    ["Total users", users.count ?? 0],
    ["Active users", activeUsers.count ?? 0],
    ["Events", events.count ?? 0],
    ["Posts", marketplace.count ?? 0],
    ["Pending approvals", (pendingEvents.count ?? 0) + (pendingLessons.count ?? 0) + (pendingMaterials.count ?? 0)]
  ];

  return (
    <>
      <PageHeader title="Admin dashboard" description="Manage users, roles, moderation, official content, offers, reports, and universities." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, count]) => (
          <Panel key={label}>
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{count}</p>
          </Panel>
        ))}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/admin/users", "User and role management"],
          ["/admin/events", "Event moderation"],
          ["/admin/materials", "Materials moderation"],
          ["/admin/lessons", "Lessons moderation"],
          ["/admin/marketplace", "Marketplace moderation"],
          ["/admin/offers", "Offers and partners"],
          ["/admin/announcements", "Official announcements"],
          ["/admin/reports", "Reports and flags"],
          ["/admin/universities", "Universities"],
          ...(roles.includes("super_admin") ? [["/admin/terms", "Terms and labels"]] : [])
        ].map(([href, label]) => <SecondaryLink key={href} href={href}>{label}</SecondaryLink>)}
      </div>
    </>
  );
}
