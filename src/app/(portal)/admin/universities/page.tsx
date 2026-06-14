import { createUniversity } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, PageHeader, Panel, PrimaryButton, SelectField } from "@/components/ui";

export default async function AdminUniversitiesPage() {
  const { supabase, roles } = await requireAdmin();
  const { data: universities } = await supabase.from("universities").select("*").order("name");

  return (
    <>
      <PageHeader title="Universities and guide pages" description="Manage active universities, allowed email domains, and New to Vienna guide content." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {roles.includes("super_admin") ? (
            <Panel>
              <h2 className="font-semibold">Add university</h2>
              <ActionForm action={createUniversity} successMessage="University created successfully." resetOnSuccess className="mt-4 space-y-4">
                <Field label="Name" name="name" required />
                <Field label="Allowed email domain" name="allowed_email_domain" placeholder="lbs.ac.at" required />
                <SelectField label="Active" name="is_active" defaultValue="true">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </SelectField>
                <PrimaryButton>Create university</PrimaryButton>
              </ActionForm>
            </Panel>
          ) : null}
        </div>
        <Panel>
          <h2 className="font-semibold">Universities</h2>
          <div className="mt-4 space-y-3">
            {universities?.length ? universities.map((university) => (
              <div key={university.id} className="rounded-lg bg-surface p-3">
                <p className="font-medium">{university.name}</p>
                <p className="mt-1 text-sm text-muted">{university.allowed_email_domain} · {university.is_active ? "Active" : "Inactive"}</p>
              </div>
            )) : <p className="text-sm text-muted">No universities have been created.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
