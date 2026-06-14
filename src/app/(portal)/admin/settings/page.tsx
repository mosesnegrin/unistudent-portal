import { updateAppSetting } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton } from "@/components/ui";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key,value,description")
    .in("key", ["community_button_label", "community_button_url"]);
  const map = new Map((settings ?? []).map((setting) => [setting.key, setting]));

  return (
    <>
      <PageHeader title="Settings" description="Configure app-level settings such as the dashboard external Community button." />
      <Panel className="max-w-2xl">
        <div className="space-y-4">
          <form action={updateAppSetting} className="space-y-3">
            <input type="hidden" name="key" value="community_button_label" />
            <input type="hidden" name="description" value="Dashboard external community button label" />
            <Field label="Community button label" name="value" defaultValue={map.get("community_button_label")?.value ?? "Community"} />
            <PrimaryButton>Save label</PrimaryButton>
          </form>
          <form action={updateAppSetting} className="space-y-3">
            <input type="hidden" name="key" value="community_button_url" />
            <input type="hidden" name="description" value="Dashboard external community button URL" />
            <Field label="Community button URL" name="value" type="url" defaultValue={map.get("community_button_url")?.value ?? ""} />
            <PrimaryButton>Save URL</PrimaryButton>
          </form>
        </div>
      </Panel>
    </>
  );
}
