import { getSessionContext } from "@/lib/auth";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";

export default async function GuidePage() {
  const { supabase, profile } = await getSessionContext();
  const { data: pages } = await supabase
    .from("guide_pages")
    .select("id,title,category,body")
    .eq("is_published", true)
    .or(`university_id.eq.${profile?.university_id},university_id.is.null`)
    .order("category");

  return (
    <>
      <PageHeader title="New to Vienna guide" description="Official guidance for bureaucracy, documents, living in Vienna, student life, and discounts." />
      <div className="space-y-3">
        {pages?.length ? pages.map((page) => (
          <Panel key={page.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold">{page.title}</h2>
              <StatusBadge value={page.category} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{page.body}</p>
          </Panel>
        )) : <EmptyState title="No guide pages yet" description="Admins can publish real guide pages from the admin dashboard." />}
      </div>
    </>
  );
}
