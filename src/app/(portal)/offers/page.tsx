import { createOffer } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate, noCreatePermissionMessage } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function OffersPage() {
  const { supabase, profile, roles } = await getSessionContext();
  const canCreateOffer = canCreate(roles, "offers");
  const { data: offers } = await supabase
    .from("offers")
    .select("id,title,description,partner_name,discount_details,expires_at,link,is_austria_wide,profiles(full_name,email,phone,user_roles(roles(name)))")
    .or(`university_id.eq.${profile?.university_id},is_austria_wide.eq.true`)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Offers" description="University-specific and Austria-wide student offers." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
        {offers?.length ? offers.map((offer) => (
          <Panel key={offer.id}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-semibold">{offer.title}</h2>
                <p className="mt-1 text-sm text-muted">{offer.partner_name}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{offer.description}</p>
                <p className="mt-3 text-sm font-medium">{offer.discount_details}</p>
              </div>
              <ProviderInfo provider={offer.profiles as never} label="Offered by" official={!offer.profiles} />
            </div>
            {offer.link ? <a className="mt-4 inline-block text-sm font-medium underline" href={offer.link}>Open offer</a> : null}
          </Panel>
        )) : <EmptyState title="No offers yet" description="Offers added by admins and partners will appear here." />}
        </div>
        {canCreateOffer ? (
          <Panel>
            <h2 className="font-semibold">Add offer</h2>
            <form action={createOffer} className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <Field label="Partner name" name="partner_name" required />
              <Field label="Discount details" name="discount_details" required />
              <Field label="Expiry date" name="expires_at" type="date" />
              <Field label="Link" name="link" type="url" />
              <SelectField label="Austria-wide" name="is_austria_wide" defaultValue="false">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </SelectField>
              <PrimaryButton>Submit offer</PrimaryButton>
            </form>
          </Panel>
        ) : (
          <EmptyState title="Permission required" description={noCreatePermissionMessage("offer")} />
        )}
      </div>
    </>
  );
}
