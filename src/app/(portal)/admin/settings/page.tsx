import { requireAdmin } from "@/lib/auth";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Settings" description="App settings are managed from their specific admin areas." />
      <Panel className="mx-auto max-w-2xl">
        <h2 className="font-semibold">University community buttons</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Community button labels and URLs are now configured per university, so one university's button never affects another.
        </p>
        <div className="mt-4">
          <SecondaryLink href="/admin/universities">Manage university settings</SecondaryLink>
        </div>
      </Panel>
    </>
  );
}
