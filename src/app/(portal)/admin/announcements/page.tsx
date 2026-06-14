import { createAnnouncement } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function AdminAnnouncementsPage() {
  const { supabase, roles } = await requireAdmin();
  const [{ data: announcements }, { data: universities }] = await Promise.all([
    supabase.from("announcements").select("id,title,is_published,created_at").order("created_at", { ascending: false }),
    supabase.from("universities").select("id,name").order("name")
  ]);

  return (
    <>
      <PageHeader title="Official announcements" description="Publish official updates to students." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel>
          <h2 className="font-semibold">Create announcement</h2>
          <form action={createAnnouncement} className="mt-4 space-y-4">
            <Field label="Title" name="title" required />
            <TextArea label="Body" name="body" required />
            <label className="block">
              <span className="text-sm font-medium">Image</span>
              <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Document</span>
              <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
            </label>
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
            <PrimaryButton>Create announcement</PrimaryButton>
          </form>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Announcements</h2>
          <div className="mt-4 space-y-3">
            {announcements?.length ? announcements.map((item) => (
              <div key={item.id} className="rounded-lg bg-surface p-3">
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.is_published ? "Published" : "Draft"}</p>
              </div>
            )) : <p className="text-sm text-muted">No announcements yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
