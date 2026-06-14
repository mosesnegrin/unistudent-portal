import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/auth";
import { getAdminNavigation, studentNavigation } from "@/lib/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile, isAdmin, roles } = await getSessionContext();
  const isSuperAdmin = roles.includes("super_admin");
  const { data: university } = profile?.university_id
    ? await supabase.from("universities").select("name").eq("id", profile.university_id).maybeSingle()
    : { data: null };
  const title = isSuperAdmin
    ? "UniStudents - Admin Dashboard"
    : `UniStudents - ${university?.name ?? "University"} Portal`;

  return (
    <AppShell
      title={title}
      navigation={isAdmin ? getAdminNavigation(isSuperAdmin) : studentNavigation}
      userName={profile?.full_name}
    >
      {children}
    </AppShell>
  );
}
