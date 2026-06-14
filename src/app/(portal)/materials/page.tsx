import { createMaterial, requestMaterial } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate, noCreatePermissionMessage } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function MaterialsPage() {
  const { supabase, profile, roles } = await getSessionContext();
  const canCreateMaterial = canCreate(roles, "materials");
  const { data: materials } = await supabase
    .from("materials")
    .select("id,course_name,title,description,is_free,price_cents,file_path,profiles(full_name,email,phone,user_roles(roles(name)))")
    .eq("moderation_status", "approved")
    .eq("university_id", profile?.university_id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Notes and materials" description="Browse approved study materials or submit your own notes for moderation." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {materials?.length ? materials.map((material) => (
            <Panel key={material.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-semibold">{material.title}</h2>
                  <p className="mt-1 text-sm text-muted">{material.course_name}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{material.description}</p>
                  <p className="mt-3 text-sm">{material.is_free ? "Free" : `EUR ${((material.price_cents ?? 0) / 100).toFixed(2)}`}</p>
                </div>
                <ProviderInfo provider={material.profiles as never} label="Offered by" />
              </div>
              <form action={requestMaterial} className="mt-4 space-y-3">
                <input type="hidden" name="material_id" value={material.id} />
                <TextArea label={material.is_free ? "Request message" : "Paid material request"} name="message" />
                <PrimaryButton>{material.is_free ? "Request/download" : "Request paid material"}</PrimaryButton>
              </form>
            </Panel>
          )) : <EmptyState title="No approved materials yet" description="Approved notes and materials will appear here." />}
        </div>
        {canCreateMaterial ? (
          <Panel>
            <h2 className="font-semibold">Upload material</h2>
            <form action={createMaterial} className="mt-4 space-y-4">
              <Field label="Course name" name="course_name" required />
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <label className="block">
                <span className="text-sm font-medium">File</span>
                <input name="file" type="file" className="focus-ring mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm" />
              </label>
              <SelectField label="Free or paid" name="is_free" defaultValue="true" required>
                <option value="true">Free</option>
                <option value="false">Paid</option>
              </SelectField>
              <Field label="Price in cents" name="price_cents" type="number" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </form>
          </Panel>
        ) : (
          <EmptyState title="Permission required" description={noCreatePermissionMessage("material")} />
        )}
      </div>
    </>
  );
}
