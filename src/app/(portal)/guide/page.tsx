import { getSessionContext } from "@/lib/auth";
import { CategoryLabel } from "@/components/category-icon";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui";

export default async function GuidePage() {
  const { supabase, profile } = await getSessionContext();
  const { data: pages } = await supabase
    .from("guide_pages")
    .select("id,title,category,body,image_url,document_url,document_name")
    .eq("is_published", true)
    .or(`university_id.eq.${profile?.university_id},university_id.is.null`)
    .or(`auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
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
            <p className="mt-2 text-sm text-muted"><CategoryLabel category={page.category} /></p>
            {page.image_url ? <img src={page.image_url} alt="" className="mt-4 max-h-80 w-full rounded-lg object-cover" /> : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{page.body}</p>
            {page.document_url ? <a className="focus-ring mt-4 inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-medium" href={page.document_url} target="_blank" rel="noreferrer">Download document</a> : null}
          </Panel>
        )) : <EmptyState title="No guide pages yet" description="Admins can publish real guide pages from the admin dashboard." />}
      </div>
    </>
  );
}
