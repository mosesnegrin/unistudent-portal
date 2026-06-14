import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/auth";
import { getAdminNavigation, studentNavigation } from "@/lib/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, roles } = await getSessionContext();

  return (
    <AppShell
      title={isAdmin ? "UniStudent Admin" : "UniStudent Portal"}
      navigation={isAdmin ? getAdminNavigation(roles.includes("super_admin")) : studentNavigation}
      userName={profile?.full_name}
    >
      {children}
    </AppShell>
  );
}
