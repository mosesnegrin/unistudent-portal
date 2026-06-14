import { createAnnouncement } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/date-format";
import { ActionForm } from "@/components/action-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";

export default async function AdminAnnouncementsPage() {
  const { profile, roles } = await requireAdmin();
  const supabase = createServiceRoleClient();
  let announcementsQuery = supabase
    .from("announcements")
    .select("id,title,is_published,created_at,university_id,auto_delete_at,universities(name)")
    .order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) announcementsQuery = announcementsQuery.eq("university_id", profile?.university_id);
  const [{ data: announcements }, { data: universities }] = await Promise.all([
    announcementsQuery,
    supabase.from("universities").select("id,name").order("name")
  ]);

  return (
    <>
      <PageHeader title="Official announcements" description="Publish official updates to students." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel>
          <h2 className="font-semibold">Create announcement</h2>
          <ActionForm action={createAnnouncement} successMessage="Announcement published successfully." resetOnSuccess className="mt-4 space-y-4">
            <Field label="Title" name="title" required />
            <TextArea label="Body" name="body" required />
            <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
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
          </ActionForm>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Announcements</h2>
          <div className="mt-4 space-y-3">
            {announcements?.length ? announcements.map((item) => {
              const university = item.universities as { name?: string | null } | null;
              const expired = Boolean(item.auto_delete_at && new Date(item.auto_delete_at) <= new Date());
              return (
              <div key={item.id} className="rounded-xl border border-line bg-surface p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{university?.name ?? "All universities"} · {formatDate(item.created_at)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge value={item.is_published ? "approved" : "draft"} />
                      {expired ? <StatusBadge value="expired" /> : null}
                    </div>
                  </div>
                  <ConfirmDeleteButton table="announcements" id={item.id} label={item.title} />
                </div>
              </div>
            );}) : <p className="text-sm text-muted">No announcements yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
