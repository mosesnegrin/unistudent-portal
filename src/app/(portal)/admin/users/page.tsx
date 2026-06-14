import { requireAdmin } from "@/lib/auth";
import { PageHeader, Panel, SelectField } from "@/components/ui";
import { RoleManager } from "@/components/admin";
import { DeleteUserButton } from "@/components/delete-user-button";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ university?: string }>;
}) {
  const { university } = await searchParams;
  const { profile, roles, user: currentUser } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  const { data: universities } = await adminClient.from("universities").select("id,name").order("name");
  const universityId = roles.includes("super_admin") ? university : profile?.university_id;
  let query = adminClient
    .from("profiles")
    .select("id,full_name,email,phone,is_active,university_id,created_at,universities(name),user_roles(roles(name))")
    .order("created_at", { ascending: false });
  if (universityId) query = query.eq("university_id", universityId);
  const { data: users, error } = await query;

  return (
    <>
      <PageHeader title="Users" description="View users, filter by university, and assign or remove roles." />
      {roles.includes("super_admin") ? (
        <Panel className="mb-4">
          <form>
            <SelectField label="University filter" name="university" defaultValue={university ?? ""}>
              <option value="">All universities</option>
              {universities?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectField>
            <button className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">Apply</button>
          </form>
        </Panel>
      ) : null}
      {error ? (
        <Panel>
          <p className="text-sm text-rose-700">{error.message}</p>
        </Panel>
      ) : null}
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">University</th>
                <th className="py-2 pr-3 font-medium">Phone</th>
                <th className="py-2 pr-3 font-medium">Roles</th>
                <th className="py-2 pr-3 font-medium">Created</th>
                {roles.includes("super_admin") ? <th className="py-2 pr-3 font-medium">Delete</th> : null}
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user) => {
                const roleRows = (user.user_roles ?? []) as unknown as Array<{ roles: { name?: string } | { name?: string }[] | null }>;
                const assigned = roleRows
                  .map((item) => Array.isArray(item.roles) ? item.roles[0]?.name : item.roles?.name)
                  .filter(Boolean) as string[];
                const universityRow = user.universities as unknown as { name?: string } | { name?: string }[] | null;
                const universityName = (Array.isArray(universityRow) ? universityRow[0]?.name : universityRow?.name) ?? "";
                return (
                  <tr key={user.id} className="border-b border-line align-top last:border-0">
                    <td className="py-3 pr-3 font-medium">{user.full_name}</td>
                    <td className="py-3 pr-3">{user.email}</td>
                    <td className="py-3 pr-3">{universityName}</td>
                    <td className="py-3 pr-3">{user.phone ?? ""}</td>
                    <td className="py-3 pr-3"><RoleManager userId={user.id} roles={assigned} /></td>
                    <td className="py-3 pr-3">{user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}</td>
                    {roles.includes("super_admin") ? (
                      <td className="py-3 pr-3">
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.full_name || user.email}
                          disabled={user.id === currentUser.id}
                        />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!error && !users?.length ? (
          <p className="mt-4 rounded-lg border border-dashed border-line bg-surface p-4 text-sm text-muted">
            No users found for the selected scope.
          </p>
        ) : null}
      </Panel>
    </>
  );
}
