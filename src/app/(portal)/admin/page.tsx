import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/date-format";
import { firstName } from "@/lib/format";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";

type WaitingItem = {
  type: string;
  title: string;
  createdBy?: string | null;
  createdAt?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  reviewHref: string;
};

export default async function AdminPage() {
  const { supabase, profile, isPlatformAdmin, effectiveUniversityId } = await requireAdmin();
  const universityFilter = isPlatformAdmin ? effectiveUniversityId ?? undefined : profile?.university_id;
  const adminClient = createServiceRoleClient();

  const scoped = (table: string) => {
    const query = supabase.from(table).select("id", { count: "exact", head: true });
    return universityFilter ? query.eq("university_id", universityFilter) : query;
  };

  const [users, activeUsers, events, marketplace, pendingEvents, pendingLessons, pendingMaterials, pendingOffers, pendingMarketplace, draftAnnouncements, draftGuide] = await Promise.all([
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
    scoped("materials").eq("moderation_status", "pending"),
    scoped("offers").eq("moderation_status", "pending"),
    scoped("marketplace_items").eq("moderation_status", "pending"),
    scoped("announcements").eq("is_published", false),
    scoped("guide_pages").eq("is_published", false)
  ]);

  const stats = [
    ["Total users", users.count ?? 0],
    ["Active users", activeUsers.count ?? 0],
    ["Events", events.count ?? 0],
    ["Posts", marketplace.count ?? 0],
    ["Pending approvals", (pendingEvents.count ?? 0) + (pendingLessons.count ?? 0) + (pendingMaterials.count ?? 0) + (pendingOffers.count ?? 0) + (pendingMarketplace.count ?? 0) + (draftAnnouncements.count ?? 0) + (draftGuide.count ?? 0)]
  ];

  const pendingQuery = (table: string, select: string) => {
    let query = adminClient.from(table).select(select).order("created_at", { ascending: false }).limit(8);
    if (universityFilter) query = query.eq("university_id", universityFilter);
    return query;
  };
  const [
    { data: waitingEvents },
    { data: waitingLessons },
    { data: waitingMaterials },
    { data: waitingOffers },
    { data: waitingMarketplace },
    { data: waitingAnnouncements },
    { data: waitingGuide }
  ] = await Promise.all([
    pendingQuery("events", "id,title,created_at,created_by,profiles(full_name,email)").eq("moderation_status", "pending"),
    pendingQuery("lessons", "id,course_name,created_at,created_by,profiles(full_name,email)").eq("moderation_status", "pending"),
    pendingQuery("materials", "id,title,file_path,created_at,created_by,profiles(full_name,email)").eq("moderation_status", "pending"),
    pendingQuery("offers", "id,title,document_url,document_name,created_at,created_by,profiles(full_name,email)").eq("moderation_status", "pending"),
    pendingQuery("marketplace_items", "id,title,created_at,seller_id,profiles(full_name,email)").eq("moderation_status", "pending"),
    pendingQuery("announcements", "id,title,document_url,document_name,created_at,created_by,profiles(full_name,email)").eq("is_published", false),
    pendingQuery("guide_pages", "id,title,document_url,document_name,created_at,created_by,profiles(full_name,email)").eq("is_published", false)
  ]);

  const profileName = (item: Record<string, unknown>, relation = "profiles") => {
    const row = item[relation] as { full_name?: string | null; email?: string | null } | null;
    return row?.full_name || row?.email || "Unknown user";
  };
  const rows = (items: unknown) => (items ?? []) as Array<Record<string, unknown>>;
  const waitingItems: WaitingItem[] = [
    ...rows(waitingEvents).map((item) => ({ type: "Event", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), reviewHref: "/admin/events" })),
    ...rows(waitingLessons).map((item) => ({ type: "Lesson", title: String(item.course_name ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), reviewHref: "/admin/lessons" })),
    ...rows(waitingMaterials).map((item) => ({ type: "Material", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), documentName: item.file_path ? "Material file" : null, reviewHref: "/admin/materials" })),
    ...rows(waitingOffers).map((item) => ({ type: "Offer", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), documentUrl: item.document_url ? String(item.document_url) : null, documentName: item.document_name ? String(item.document_name) : null, reviewHref: "/admin/offers" })),
    ...rows(waitingMarketplace).map((item) => ({ type: "Marketplace", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), reviewHref: "/admin/marketplace" })),
    ...rows(waitingAnnouncements).map((item) => ({ type: "Announcement draft", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), documentUrl: item.document_url ? String(item.document_url) : null, documentName: item.document_name ? String(item.document_name) : null, reviewHref: "/admin/announcements" })),
    ...rows(waitingGuide).map((item) => ({ type: "Guide draft", title: String(item.title ?? "Untitled"), createdBy: profileName(item), createdAt: String(item.created_at ?? ""), documentUrl: item.document_url ? String(item.document_url) : null, documentName: item.document_name ? String(item.document_name) : null, reviewHref: "/admin/guide" }))
  ]
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 12);

  return (
    <>
      <PageHeader title={`Welcome ${firstName(profile?.full_name, profile?.email)}`} description="Manage users, roles, moderation, official content, offers, reports, and universities." />
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
          ["/admin/guide", "Guide material"],
          ["/admin/reports", "Reports and flags"],
          ["/admin/universities", "Universities"]
        ].map(([href, label]) => <SecondaryLink key={href} href={href}>{label}</SecondaryLink>)}
      </div>
      <Panel className="mt-6">
        <h2 className="font-semibold">Waiting for approval</h2>
        <div className="mt-4 overflow-x-auto">
          {waitingItems.length ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Title/name</th>
                  <th className="py-2 pr-3 font-medium">Created by</th>
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 pr-3 font-medium">File/document</th>
                  <th className="py-2 pr-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {waitingItems.map((item, index) => (
                  <tr key={`${item.type}-${item.title}-${index}`} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3">{item.type}</td>
                    <td className="py-3 pr-3 font-medium">{item.title}</td>
                    <td className="py-3 pr-3">{item.createdBy}</td>
                    <td className="py-3 pr-3">{item.createdAt ? formatDate(item.createdAt) : ""}</td>
                    <td className="py-3 pr-3">
                      {item.documentUrl ? <a href={item.documentUrl} target="_blank" rel="noreferrer" className="font-medium underline">{item.documentName || "Download document"}</a> : item.documentName ?? "No file"}
                    </td>
                    <td className="py-3 pr-3">
                      <a href={item.reviewHref} className="font-medium underline">Review</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">No items are waiting for review.</p>
          )}
        </div>
      </Panel>
    </>
  );
}
