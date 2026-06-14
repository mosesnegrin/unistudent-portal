import { requireAdmin } from "@/lib/auth";
import { PageHeader, Panel, StatusBadge } from "@/components/ui";

export default async function AdminReportsPage() {
  const { supabase } = await requireAdmin();
  const { data: reports } = await supabase
    .from("reports")
    .select("id,subject_type,subject_id,reason,status,created_at,profiles(full_name,email)")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Reports and flagged content" description="Review reports submitted by students. Flag counters are stored on moderated content for future AI moderation workflows." />
      <Panel>
        <div className="space-y-3">
          {reports?.length ? reports.map((report) => {
            const reporter = report.profiles as { full_name?: string; email?: string } | null;
            return (
              <div key={report.id} className="rounded-lg bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{report.subject_type}: {report.subject_id}</p>
                  <StatusBadge value={report.status} />
                </div>
                <p className="mt-2 text-sm text-muted">{report.reason}</p>
                <p className="mt-2 text-xs text-muted">Reported by {reporter?.full_name ?? reporter?.email ?? "Unknown user"}</p>
              </div>
            );
          }) : <p className="text-sm text-muted">No reports have been submitted.</p>}
        </div>
      </Panel>
    </>
  );
}
