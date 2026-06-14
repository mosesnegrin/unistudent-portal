import { createMaterial, requestMaterial } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { formatEuro, moneyInputPattern } from "@/lib/money";
import { canCreate } from "@/lib/permissions";
import { ActionForm } from "@/components/action-form";
import { ProviderInfo } from "@/components/provider-info";
import { SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateMaterial = canCreate(roles, "materials");
  const activeTab = requestedTab === "requests" || (requestedTab === "create" && canCreateMaterial) ? requestedTab : "all";
  const nav = [
    { href: "/materials", label: "All materials" },
    { href: "/materials?tab=requests", label: "My material requests/downloads" },
    ...(canCreateMaterial ? [{ href: "/materials?tab=create", label: "Upload material" }] : [])
  ];
  const materialSelect = "id,course_name,title,description,is_free,price_cents,file_path,profiles(full_name,email,phone)";
  const { data } = activeTab === "requests"
    ? await supabase.from("material_requests").select(`status,message,materials(${materialSelect})`).eq("requester_id", user.id).order("created_at", { ascending: false })
    : activeTab === "all"
      ? await supabase.from("materials").select(materialSelect).eq("moderation_status", "approved").eq("university_id", profile?.university_id).order("created_at", { ascending: false })
        .or(`auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
      : { data: [] };
  const materials = (activeTab === "requests"
    ? ((data ?? []) as Array<Record<string, unknown>>).map((item) => {
        const material = item.materials as Record<string, unknown> | Record<string, unknown>[] | null;
        return Array.isArray(material) ? material[0] : material;
      })
    : ((data ?? []) as Array<Record<string, unknown>>)
  ).filter(Boolean) as Array<Record<string, unknown>>;
  const downloadablePaths = materials
    .filter((material) => material.is_free && material.file_path)
    .map((material) => String(material.file_path));
  const signedUrls = new Map<string, string>();
  if (downloadablePaths.length) {
    const { data: signed } = await supabase.storage.from("materials").createSignedUrls(downloadablePaths, 60 * 10);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) signedUrls.set(item.path, item.signedUrl);
    }
  }

  return (
    <>
      <PageHeader title="Notes and materials" description="Browse approved study materials or submit your own notes for moderation." />
      <SubNav items={nav} active={activeTab} />
      <div className={activeTab === "create" ? "mx-auto max-w-2xl" : "grid gap-4 lg:grid-cols-[1fr_380px]"}>
        <div className="space-y-3">
          {activeTab !== "create" && materials?.length ? materials.map((material) => (
            <Panel key={String(material.id)}>
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-semibold">{String(material.title)}</h2>
                  <p className="mt-1 text-sm text-muted">{String(material.course_name)}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{String(material.description)}</p>
                  <p className="mt-3 text-sm">{material.is_free ? "Free" : formatEuro(material.price_cents as string | number | null)}</p>
                </div>
                <ProviderInfo provider={material.profiles as never} label="Offered by" />
              </div>
              {activeTab === "all" ? (
                material.is_free && material.file_path && signedUrls.get(String(material.file_path)) ? (
                  <a className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white" href={signedUrls.get(String(material.file_path))} target="_blank" rel="noreferrer">Download</a>
                ) : material.is_free ? (
                  <ActionForm action={requestMaterial} successMessage="Material request sent." className="mt-4 space-y-3">
                    <input type="hidden" name="material_id" value={String(material.id)} />
                    <TextArea label="Request message" name="message" />
                    <PrimaryButton>Request material</PrimaryButton>
                  </ActionForm>
                ) : (
                  <details className="mt-4 rounded-lg bg-surface p-3 text-sm">
                    <summary className="cursor-pointer font-medium">Contact seller</summary>
                    <ProviderInfo provider={material.profiles as never} label="Seller contact" />
                  </details>
                )
              ) : null}
            </Panel>
          )) : activeTab !== "create" ? <EmptyState title="No materials found" description="Materials for this view will appear here." /> : null}
        </div>
        {activeTab === "create" && canCreateMaterial ? (
          <Panel>
            <h2 className="font-semibold">Upload material</h2>
            <ActionForm action={createMaterial} successMessage="Material uploaded and waiting for approval." resetOnSuccess className="mt-4 space-y-4">
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
              <Field label="Price" name="price_cents" placeholder="5 or 5,30" pattern={moneyInputPattern} inputMode="decimal" title="Use whole euros like 5 or euros and cents like 5,30." />
              <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </ActionForm>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
