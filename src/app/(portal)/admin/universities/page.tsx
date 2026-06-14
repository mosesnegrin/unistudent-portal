import { createGuidePage, createUniversity } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

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
              <form action={createUniversity} className="mt-4 space-y-4">
                <Field label="Name" name="name" required />
                <Field label="Allowed email domain" name="allowed_email_domain" placeholder="lbs.ac.at" required />
                <SelectField label="Active" name="is_active" defaultValue="true">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </SelectField>
                <PrimaryButton>Create university</PrimaryButton>
              </form>
            </Panel>
          ) : null}
          <Panel>
            <h2 className="font-semibold">Create guide page</h2>
            <form action={createGuidePage} className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <SelectField label="Category" name="category" defaultValue="bureaucracy">
                <option value="bureaucracy">Bureaucracy</option>
                <option value="required_documents">Required documents</option>
                <option value="living_in_vienna">Living in Vienna</option>
                <option value="student_life">Student life</option>
                <option value="discounts_offers">Discounts/offers</option>
              </SelectField>
              <TextArea label="Body" name="body" required />
              <SelectField label="Published" name="is_published" defaultValue="true">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </SelectField>
              {roles.includes("super_admin") ? (
                <SelectField label="University" name="university_id">
                  <option value="">All universities</option>
                  {universities?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </SelectField>
              ) : null}
              <PrimaryButton>Create guide page</PrimaryButton>
            </form>
          </Panel>
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
