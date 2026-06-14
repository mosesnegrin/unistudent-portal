import { redirect } from "next/navigation";
import { createSiteTerm, deleteSiteTerm, updateSiteTerm } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function AdminTermsPage() {
  const { supabase, roles } = await requireAdmin();
  if (!roles.includes("super_admin")) redirect("/admin");

  const { data: terms, error } = await supabase
    .from("site_terms")
    .select("id,key,value,description,category,updated_at")
    .order("category")
    .order("key");

  return (
    <>
      <PageHeader title="Terms" description="Manage website-wide labels, role names, guide terms, and the dashboard external button." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel>
          <h2 className="font-semibold">Add term</h2>
          <form action={createSiteTerm} className="mt-4 space-y-4">
            <Field label="Key" name="key" required />
            <TextArea label="Value" name="value" />
            <Field label="Category" name="category" />
            <TextArea label="Description" name="description" />
            <PrimaryButton>Add term</PrimaryButton>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Existing terms</h2>
          {error ? <p className="mt-4 text-sm text-rose-700">{error.message}</p> : null}
          <div className="mt-4 space-y-4">
            {terms?.length ? terms.map((term) => (
              <div key={term.id} className="rounded-lg border border-line bg-surface p-3">
                <p className="text-sm font-semibold">{term.key}</p>
                <form id={`term-${term.id}`} action={updateSiteTerm} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={term.id} />
                  <TextArea label="Value" name="value" defaultValue={term.value} />
                  <Field label="Category" name="category" defaultValue={term.category} />
                  <TextArea label="Description" name="description" defaultValue={term.description} />
                </form>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button form={`term-${term.id}`} className="focus-ring min-h-11 rounded-lg bg-ink px-4 text-sm font-medium text-white">
                    Save
                  </button>
                  <form action={deleteSiteTerm}>
                    <input type="hidden" name="id" value={term.id} />
                    <input type="hidden" name="key" value={term.key} />
                    <button className="focus-ring min-h-11 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )) : <p className="text-sm text-muted">No terms have been created.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
