import { getSessionContext } from "@/lib/auth";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export default async function OffersPage() {
  const { supabase, profile } = await getSessionContext();
  const { data: offers } = await supabase
    .from("offers")
    .select("id,title,description,partner_name,discount_details,expires_at,link,is_austria_wide")
    .or(`university_id.eq.${profile?.university_id},is_austria_wide.eq.true`)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Offers" description="University-specific and Austria-wide student offers." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers?.length ? offers.map((offer) => (
          <Panel key={offer.id}>
            <h2 className="font-semibold">{offer.title}</h2>
            <p className="mt-1 text-sm text-muted">{offer.partner_name}</p>
            <p className="mt-3 text-sm leading-6 text-muted">{offer.description}</p>
            <p className="mt-3 text-sm font-medium">{offer.discount_details}</p>
            {offer.link ? <a className="mt-4 inline-block text-sm font-medium underline" href={offer.link}>Open offer</a> : null}
          </Panel>
        )) : <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="No offers yet" description="Offers added by admins will appear here." /></div>}
      </div>
    </>
  );
}
