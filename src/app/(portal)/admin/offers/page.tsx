import { createOffer } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function AdminOffersPage() {
  const { supabase, roles } = await requireAdmin();
  const [{ data: offers }, { data: universities }] = await Promise.all([
    supabase.from("offers").select("id,title,partner_name,discount_details,expires_at").order("created_at", { ascending: false }),
    supabase.from("universities").select("id,name").order("name")
  ]);

  return (
    <>
      <PageHeader title="Offers and partners" description="Add real student discounts and partner offers." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
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
            {roles.includes("super_admin") ? (
              <SelectField label="University" name="university_id">
                <option value="">No specific university</option>
                {universities?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </SelectField>
            ) : null}
            <PrimaryButton>Create offer</PrimaryButton>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Existing offers</h2>
          <div className="mt-4 space-y-3">
            {offers?.length ? offers.map((offer) => (
              <div key={offer.id} className="rounded-lg bg-surface p-3">
                <p className="font-medium">{offer.title}</p>
                <p className="mt-1 text-sm text-muted">{offer.partner_name} · {offer.discount_details}</p>
              </div>
            )) : <p className="text-sm text-muted">No offers added yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
