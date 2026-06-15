import { createAnnouncement, updateAnnouncement } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/date-format";
import { ActionForm } from "@/components/action-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";

function AnnouncementForm({
  item,
  universities,
  isPlatformAdmin
}: {
  item?: Record<string, unknown>;
  universities: Array<{ id: string; name: string }>;
  isPlatformAdmin: boolean;
}) {
  const action = item ? updateAnnouncement : createAnnouncement;
  return (
    <ActionForm action={action} successMessage={item ? "Announcement saved successfully." : "Announcement saved successfully."} resetOnSuccess={!item} className="space-y-4">
      {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      <Field label="Title" name="title" defaultValue={String(item?.title ?? "")} required />
      <TextArea label="Body" name="body" defaultValue={item?.body ? String(item.body) : ""} required />
      <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" defaultValue={String(item?.auto_delete_at ?? "")} />
      <label className="block">
        <span className="text-sm font-medium">Image</span>
        <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
      </label>
      {item?.image_url ? <img src={String(item.image_url)} alt="" className="max-h-32 w-full rounded-lg object-cover" /> : null}
      <label className="block">
        <span className="text-sm font-medium">Document</span>
        <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
      </label>
      {item?.document_url ? <a href={String(item.document_url)} target="_blank" rel="noreferrer" className="text-sm font-medium underline">Current document</a> : null}
      <SelectField label="Status" name="is_published" defaultValue={item?.is_published === false ? "false" : "true"}>
        <option value="false">Draft</option>
        <option value="true">Published</option>
      </SelectField>
      {isPlatformAdmin ? (
        <SelectField label="Visibility" name="university_id" defaultValue={String(item?.university_id ?? "")}>
          <option value="">All universities</option>
          {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
        </SelectField>
      ) : null}
      <PrimaryButton>{item ? "Save announcement" : "Create announcement"}</PrimaryButton>
    </ActionForm>
  );
}

export default async function AdminAnnouncementsPage() {
  const { profile, isPlatformAdmin, effectiveUniversityId } = await requireAdmin();
  const supabase = createServiceRoleClient();
  let announcementsQuery = supabase
    .from("announcements")
    .select("id,title,body,is_published,created_at,university_id,auto_delete_at,image_url,document_url,document_name,universities(name)")
    .order("created_at", { ascending: false });
  const universityFilter = isPlatformAdmin ? effectiveUniversityId : profile?.university_id;
  if (universityFilter) announcementsQuery = announcementsQuery.eq("university_id", universityFilter);
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
          <div className="mt-4">
            <AnnouncementForm universities={universities ?? []} isPlatformAdmin={isPlatformAdmin} />
          </div>
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
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{item.body}</p>
                    {item.document_url ? <a href={item.document_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium underline">Download document</a> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge value={item.is_published ? "published" : "draft"} />
                      {expired ? <StatusBadge value="expired" /> : null}
                    </div>
                  </div>
                  <ConfirmDeleteButton table="announcements" id={item.id} label={item.title} />
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Edit</summary>
                  <div className="mt-4">
                    <AnnouncementForm item={item as unknown as Record<string, unknown>} universities={universities ?? []} isPlatformAdmin={isPlatformAdmin} />
                  </div>
                </details>
              </div>
            );}) : <p className="text-sm text-muted">No announcements yet.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
