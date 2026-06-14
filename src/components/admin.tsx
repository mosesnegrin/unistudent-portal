import { assignRole, moderateContent, removeRole } from "@/app/actions";
import { Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";
import type { UserRole } from "@/lib/types";

export const roleOptions: UserRole[] = [
  "student",
  "tutor",
  "notes_seller",
  "event_creator",
  "partner",
  "university_admin",
  "super_admin"
];

export function ModerationTable({
  title,
  table,
  items
}: {
  title: string;
  table: string;
  items: Array<Record<string, unknown>>;
}) {
  return (
    <Panel>
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-medium">Title</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Flags</th>
              <th className="py-2 pr-3 font-medium">Moderation</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={String(item.id)} className="border-b border-line align-top last:border-0">
                <td className="py-3 pr-3 font-medium">{String(item.title ?? item.course_name ?? "Untitled")}</td>
                <td className="py-3 pr-3"><StatusBadge value={String(item.moderation_status)} /></td>
                <td className="py-3 pr-3">{String(item.flag_count ?? 0)}</td>
                <td className="py-3 pr-3">
                  <form action={moderateContent} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                    <input type="hidden" name="table" value={table} />
                    <input type="hidden" name="id" value={String(item.id)} />
                    <SelectField label="Status" name="status" defaultValue={String(item.moderation_status)}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="flagged">Flagged</option>
                    </SelectField>
                    <TextArea label="Notes" name="notes" defaultValue={String(item.moderation_notes ?? "")} />
                    <div className="self-end">
                      <PrimaryButton>Save</PrimaryButton>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!items.length ? <p className="mt-4 text-sm text-muted">No records are waiting here.</p> : null}
    </Panel>
  );
}

export function RoleManager({ userId, roles }: { userId: string; roles: string[] }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {roles.length ? roles.map((role) => (
          <form key={role} action={removeRole} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs">
            <input type="hidden" name="user_id" value={userId} />
            <input type="hidden" name="role" value={role} />
            <span>{role}</span>
            <button className="font-semibold" title={`Remove ${role}`}>×</button>
          </form>
        )) : <span className="text-sm text-muted">No roles assigned</span>}
      </div>
      <form action={assignRole} className="flex gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <select name="role" className="focus-ring min-h-10 rounded-lg border border-line bg-white px-3 text-sm">
          {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
        <PrimaryButton>Add role</PrimaryButton>
      </form>
    </div>
  );
}
