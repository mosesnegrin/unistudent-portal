import { createGuidePage, updateGuidePage } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/date-format";
import { ActionForm } from "@/components/action-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { CategoryLabel } from "@/components/category-icon";
import { Field, PageHeader, Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";

function scope(item: Record<string, unknown>) {
  const university = item.universities as { name?: string | null } | null;
  return university?.name ?? "Global / Austria-wide";
}

function creator(item: Record<string, unknown>) {
  const profile = item.profiles as { full_name?: string | null; email?: string | null } | null;
  return profile?.full_name || profile?.email || "";
}

function GuideForm({
  universities,
  roles,
  isPlatformAdmin,
  item
}: {
  universities: Array<{ id: string; name: string }>;
  roles: string[];
  isPlatformAdmin: boolean;
  item?: Record<string, unknown>;
}) {
  const action = item ? updateGuidePage : createGuidePage;
  return (
    <ActionForm action={action} successMessage={item ? "Guide material saved successfully." : "Guide material created successfully."} resetOnSuccess={!item} className="space-y-4">
      {item ? <input type="hidden" name="id" value={String(item.id)} /> : null}
      <Field label="Title" name="title" defaultValue={String(item?.title ?? "")} required />
      <SelectField label="Category" name="category" defaultValue={String(item?.category ?? "bureaucracy")}>
        <option value="bureaucracy">Bureaucracy</option>
        <option value="required_documents">Required documents</option>
        <option value="living_in_vienna">Living in Vienna</option>
        <option value="student_life">Student life</option>
        <option value="discounts_offers">Discounts/offers</option>
        <option value="academic">Academic/study</option>
        <option value="official">Official/administration</option>
      </SelectField>
      <TextArea label="Description/content" name="body" defaultValue={item?.body ? String(item.body) : ""} required />
      <SelectField label="Status" name="is_published" defaultValue={item?.is_published === false ? "false" : "true"}>
        <option value="true">Approved / published</option>
        <option value="false">Rejected / draft</option>
      </SelectField>
      {isPlatformAdmin ? (
        <SelectField label="Visibility" name="university_id" defaultValue={String(item?.university_id ?? "")}>
          <option value="">Global / Austria-wide</option>
          {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
        </SelectField>
      ) : null}
      <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
      <label className="block">
        <span className="text-sm font-medium">Image</span>
        <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Document</span>
        <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
      </label>
      <PrimaryButton>{item ? "Save guide material" : "Create guide material"}</PrimaryButton>
    </ActionForm>
  );
}

export default async function AdminGuidePage() {
  const { profile, roles, isPlatformAdmin, effectiveUniversityId } = await requireAdmin();
  const { createServiceRoleClient } = await import("@/lib/supabase/admin");
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("guide_pages")
    .select("id,title,category,body,is_published,university_id,auto_delete_at,created_at,created_by,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  const universityFilter = isPlatformAdmin ? effectiveUniversityId : profile?.university_id;
  if (universityFilter) query = query.eq("university_id", universityFilter);
  const [{ data: items }, { data: universities }] = await Promise.all([
    query,
    adminClient.from("universities").select("id,name").order("name")
  ]);

  return (
    <>
      <PageHeader title="Guide material" description="Create, edit, approve, reject, upload, and delete guide material." />
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <Panel>
          <h2 className="font-semibold">Create guide material</h2>
          <div className="mt-4">
            <GuideForm universities={universities ?? []} roles={roles} isPlatformAdmin={isPlatformAdmin} />
          </div>
        </Panel>
        <Panel>
          <h2 className="font-semibold">Guide material list</h2>
          <div className="mt-4 space-y-4">
            {items?.length ? items.map((item) => {
              const record = item as unknown as Record<string, unknown>;
              const expired = record.auto_delete_at && new Date(String(record.auto_delete_at)) <= new Date();
              return (
                <div key={String(record.id)} className="rounded-lg border border-line bg-surface p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      <h3 className="font-semibold">{String(record.title)}</h3>
                      <p className="mt-1 text-sm text-muted"><CategoryLabel category={String(record.category)} /> · {scope(record)}</p>
                      <p className="mt-2 text-sm text-muted">Created by {creator(record) || "Unknown"} · {formatDate(String(record.created_at ?? ""))}</p>
                      <div className="mt-2 flex gap-2">
                        <StatusBadge value={record.is_published ? "approved" : "rejected"} />
                        {expired ? <StatusBadge value="expired" /> : null}
                      </div>
                      {record.auto_delete_at ? <p className="mt-2 text-sm text-muted">Auto-delete: {formatDateTime(String(record.auto_delete_at))}</p> : null}
                    </div>
                    <ConfirmDeleteButton table="guide_pages" id={String(record.id)} label={String(record.title)} />
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">Edit</summary>
                    <div className="mt-4">
                      <GuideForm universities={universities ?? []} roles={roles} isPlatformAdmin={isPlatformAdmin} item={record} />
                    </div>
                  </details>
                </div>
              );
            }) : <p className="text-sm text-muted">No guide material found.</p>}
          </div>
        </Panel>
      </div>
    </>
  );
}
