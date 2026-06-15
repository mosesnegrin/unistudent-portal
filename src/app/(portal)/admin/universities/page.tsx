import { createUniversity, toggleUniversityStatus, updateUniversityCommunity, updateUniversityDetails } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, PageHeader, Panel, PrimaryButton, SelectField } from "@/components/ui";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export default async function AdminUniversitiesPage() {
  const { profile, isPlatformAdmin } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient.from("universities").select("*").order("name");
  if (!isPlatformAdmin) query = query.eq("id", profile?.university_id);
  const { data: universities } = await query;

  return (
    <>
      <PageHeader title="Universities and guide pages" description="Manage active universities, allowed email domains, and New to Vienna guide content." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {isPlatformAdmin ? (
            <Panel>
              <h2 className="font-semibold">Add university</h2>
              <ActionForm action={createUniversity} successMessage="University created successfully." resetOnSuccess className="mt-4 space-y-4">
                <Field label="Name" name="name" required />
                <Field label="Allowed email domain" name="allowed_email_domain" placeholder="lbs.ac.at" required />
                <Field label="Short code" name="short_code" placeholder="lbs" pattern="[a-z0-9-]+" title="Use lowercase letters, numbers, and hyphens only." />
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
              <div key={university.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{university.name}</p>
                    <p className="mt-1 text-sm text-muted">{university.short_code ? `${university.short_code} · ` : ""}{university.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  {isPlatformAdmin ? (
                    <ActionForm action={toggleUniversityStatus} successMessage={university.is_active ? "University deactivated." : "University reactivated."}>
                      <input type="hidden" name="id" value={university.id} />
                      <input type="hidden" name="is_active" value={university.is_active ? "false" : "true"} />
                      <button className={`focus-ring min-h-9 rounded-lg px-3 text-sm font-medium ${university.is_active ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {university.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </ActionForm>
                  ) : null}
                </div>
                <div className="mt-4 rounded-xl border border-line bg-white p-3">
                  <h3 className="text-sm font-semibold">Allowed login domains</h3>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted">Main domain</p>
                      <p className="mt-1 font-medium">{university.allowed_email_domain}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted">Admin domain</p>
                      <p className="mt-1 font-medium">admin.{university.allowed_email_domain}</p>
                    </div>
                  </div>
                </div>
                <ActionForm action={updateUniversityDetails} successMessage="University details saved." className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input type="hidden" name="id" value={university.id} />
                  <Field label="Name" name="name" defaultValue={university.name} required />
                  <Field label="Main domain" name="allowed_email_domain" defaultValue={university.allowed_email_domain} required />
                  <Field label="Short code" name="short_code" defaultValue={university.short_code ?? ""} pattern="[a-z0-9-]+" title="Use lowercase letters, numbers, and hyphens only." />
                  <div className="self-end">
                    <PrimaryButton>Save</PrimaryButton>
                  </div>
                </ActionForm>
                <ActionForm action={updateUniversityCommunity} successMessage="Community button settings saved." className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="id" value={university.id} />
                  <Field label="Community button label" name="community_button_label" defaultValue={university.community_button_label ?? "Community"} />
                  <Field label="Community button URL" name="community_button_url" type="url" defaultValue={university.community_button_url ?? ""} />
                  <div className="self-end">
                    <PrimaryButton>Save</PrimaryButton>
                  </div>
                </ActionForm>
              </div>
            )) : <p className="text-sm text-muted">No universities have been created.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
