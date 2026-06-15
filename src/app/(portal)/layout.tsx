import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getSessionContext } from "@/lib/auth";
import { getAdminNavigation, studentNavigation } from "@/lib/navigation";

function platformTitle({ universityName, isAdmin, isCompany }: { universityName?: string | null; isAdmin: boolean; isCompany: boolean }) {
  if (isCompany && !universityName) return isAdmin ? "UniStudents - Admin Dashboard" : "UniStudents";
  if (isAdmin) return `UniStudents - ${universityName ?? "Admin"} Admin Dashboard`;
  return `UniStudents - ${universityName ?? "University"} Portal`;
}

export async function generateMetadata(): Promise<Metadata> {
  const { supabase, profile, isAdmin, isCompany, effectiveUniversityId } = await getSessionContext();
  const universityId = isCompany ? effectiveUniversityId : profile?.university_id;
  const { data: university } = universityId
    ? await supabase.from("universities").select("name").eq("id", universityId).maybeSingle()
    : { data: null };

  return {
    title: platformTitle({ universityName: university?.name, isAdmin, isCompany })
  };
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile, isAdmin, isCompany, isPlatformAdmin, effectiveUniversityId } = await getSessionContext();
  const universityId = isCompany ? effectiveUniversityId : profile?.university_id;
  const { data: university } = universityId
    ? await supabase.from("universities").select("name").eq("id", universityId).maybeSingle()
    : { data: null };
  const { data: companyUniversities } = isCompany
    ? await supabase.from("universities").select("id,name").order("name")
    : { data: [] };
  const title = platformTitle({ universityName: university?.name, isAdmin, isCompany });

  return (
    <AppShell
      title={title}
      navigation={isAdmin ? getAdminNavigation(isPlatformAdmin) : studentNavigation}
      userName={profile?.full_name}
      companyUniversities={isCompany ? companyUniversities ?? [] : undefined}
      selectedUniversityId={effectiveUniversityId}
    >
      {children}
    </AppShell>
  );
}
