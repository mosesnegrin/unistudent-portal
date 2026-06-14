import { getSessionContext } from "@/lib/auth";
import { CategoryLabel } from "@/components/category-icon";
import { CategoryFilter } from "@/components/subnav";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export default async function GuidePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category: activeCategory } = await searchParams;
  const { supabase, effectiveUniversityId } = await getSessionContext();
  const { data: pages } = await supabase
    .from("guide_pages")
    .select("id,title,category,body,image_url,document_url,document_name")
    .eq("is_published", true)
    .or(`university_id.eq.${effectiveUniversityId},university_id.is.null`)
    .or(`auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
    .order("category");
  const categories = (pages ?? []).map((page) => page.category).filter(Boolean);
  const filteredPages = activeCategory ? (pages ?? []).filter((page) => page.category === activeCategory) : (pages ?? []);

  return (
    <>
      <PageHeader title="New to Vienna guide" description="Official guidance for bureaucracy, documents, living in Vienna, student life, and discounts." />
      <CategoryFilter basePath="/guide" categories={categories} activeCategory={activeCategory} />
      <div className="space-y-3">
        {filteredPages?.length ? filteredPages.map((page) => (
          <Panel key={page.id}>
            <h2 className="text-base font-semibold">{page.title}</h2>
            <div className="mt-2"><CategoryLabel category={page.category} /></div>
            {page.image_url ? <img src={page.image_url} alt="" className="mt-4 max-h-80 w-full rounded-lg object-cover" /> : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{page.body}</p>
            {page.document_url ? <a className="focus-ring mt-4 inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-medium" href={page.document_url} target="_blank" rel="noreferrer">Download document</a> : null}
          </Panel>
        )) : <EmptyState title="No guide pages yet" description="Admins can publish real guide pages from the admin dashboard." />}
      </div>
    </>
  );
}
