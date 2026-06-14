import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/auth";
import { adminNavigation, studentNavigation } from "@/lib/navigation";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin } = await getSessionContext();

  return (
    <AppShell
      title={isAdmin ? "UniStudent Admin" : "UniStudent Portal"}
      navigation={isAdmin ? adminNavigation : studentNavigation}
      userName={profile?.full_name}
    >
      {children}
    </AppShell>
  );
}
