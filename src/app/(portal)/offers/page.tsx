import { createOffer } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateOffer = canCreate(roles, "offers");
  const activeTab = requestedTab === "mine" || (requestedTab === "create" && canCreateOffer) ? requestedTab : "all";
  const nav = [
    { href: "/offers", label: "All offers" },
    ...(canCreateOffer ? [{ href: "/offers?tab=mine", label: "My offers/partner posts" }, { href: "/offers?tab=create", label: "Add offer" }] : [])
  ];
  let query = supabase
    .from("offers")
    .select("id,title,description,partner_name,discount_details,expires_at,link,is_austria_wide,image_url,document_url,document_name,profiles(full_name,email,phone)")
    .order("created_at", { ascending: false });
  if (activeTab === "mine") {
    query = query.eq("created_by", user.id);
  } else {
    query = query.eq("moderation_status", "approved").or(`university_id.eq.${profile?.university_id},is_austria_wide.eq.true`);
  }
  const { data: offers } = await query;

  return (
    <>
      <PageHeader title="Offers" description="University-specific and Austria-wide student offers." />
      <SubNav items={nav} active={activeTab} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
        {activeTab !== "create" && offers?.length ? offers.map((offer) => (
          <Panel key={offer.id}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-semibold">{offer.title}</h2>
                <p className="mt-1 text-sm text-muted">{offer.partner_name}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{offer.description}</p>
                <p className="mt-3 text-sm font-medium">{offer.discount_details}</p>
                {offer.image_url ? <img src={offer.image_url} alt="" className="mt-4 max-h-64 w-full rounded-lg object-cover" /> : null}
              </div>
              <ProviderInfo provider={offer.profiles as never} label="Offered by" official={!offer.profiles} />
            </div>
            {offer.link ? <a className="mt-4 inline-block text-sm font-medium underline" href={offer.link}>Open offer</a> : null}
            {offer.document_url ? <a className="focus-ring mt-4 inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-medium" href={offer.document_url} target="_blank" rel="noreferrer">Download document</a> : null}
            {!offer.link && offer.profiles ? (
              <details className="mt-4 rounded-lg bg-surface p-3 text-sm">
                <summary className="cursor-pointer font-medium">Contact provider</summary>
                <ProviderInfo provider={offer.profiles as never} label="Provider contact" />
              </details>
            ) : null}
          </Panel>
        )) : activeTab !== "create" ? <EmptyState title="No offers found" description="Offers for this view will appear here." /> : null}
        </div>
        {activeTab === "create" && canCreateOffer ? (
          <Panel>
            <h2 className="font-semibold">Add offer</h2>
            <form action={createOffer} className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <Field label="Partner name" name="partner_name" required />
              <Field label="Discount details" name="discount_details" required />
              <Field label="Expiry date" name="expires_at" type="date" />
              <Field label="Link" name="link" type="url" />
              <label className="block">
                <span className="text-sm font-medium">Image</span>
                <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Document</span>
                <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
              </label>
              <SelectField label="Austria-wide" name="is_austria_wide" defaultValue="false">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </SelectField>
              <PrimaryButton>Submit offer</PrimaryButton>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
