import { createOffer } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/date-format";
import { ActionForm } from "@/components/action-form";
import { ManagementTable } from "@/components/admin";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";
import { createServiceRoleClient } from "@/lib/supabase/admin";

function provider(item: Record<string, unknown>, field: "full_name" | "email") {
  const profile = item.profiles as { full_name?: string | null; email?: string | null } | null;
  return profile?.[field] ?? "";
}

function scope(item: Record<string, unknown>) {
  if (item.is_austria_wide) return "Austria-wide";
  const row = item.universities as { name?: string | null } | null;
  return row?.name ?? "Global";
}

export default async function AdminOffersPage() {
  const { supabase, profile, roles } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let offersQuery = adminClient
    .from("offers")
    .select("id,title,description,partner_name,discount_details,expires_at,is_austria_wide,moderation_status,auto_delete_at,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) offersQuery = offersQuery.eq("university_id", profile?.university_id);
  const [{ data: offers }, { data: universities }] = await Promise.all([
    offersQuery,
    supabase.from("universities").select("id,name").order("name")
  ]);

  return (
    <>
      <PageHeader title="Offers and partners" description="Add real student discounts and partner offers." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel>
          <h2 className="font-semibold">Add offer</h2>
          <ActionForm action={createOffer} successMessage="Offer saved successfully." resetOnSuccess className="mt-4 space-y-4">
            <Field label="Title" name="title" required />
            <TextArea label="Description" name="description" required />
            <Field label="Partner name" name="partner_name" required />
            <Field label="Discount details" name="discount_details" required />
            <Field label="Expiry date" name="expires_at" type="date" />
            <Field label="Link" name="link" type="url" />
            <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
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
            {roles.includes("super_admin") ? (
              <SelectField label="University" name="university_id">
                <option value="">No specific university</option>
                {universities?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </SelectField>
            ) : null}
            <PrimaryButton>Create offer</PrimaryButton>
          </ActionForm>
        </Panel>
        <ManagementTable
          title="Offers"
          table="offers"
          items={(offers ?? []) as Array<Record<string, unknown>>}
          columns={[
            { key: "title", label: "Title" },
            { key: "description", label: "Description" },
            { key: "partner_name", label: "Partner/offered by" },
            { key: "contact", label: "Email/contact", render: (item) => provider(item, "email") },
            { key: "discount_details", label: "Discount details" },
            { key: "expires_at", label: "Expiry date", render: (item) => formatDate(String(item.expires_at ?? "")) },
            { key: "scope", label: "University/global", render: scope }
          ]}
        />
      </div>
    </>
  );
}
