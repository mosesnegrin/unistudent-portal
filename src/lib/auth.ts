import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const adminRoles: UserRole[] = ["university_admin", "super_admin", "company"];
export const platformRoles: UserRole[] = ["super_admin", "company"];
export const deactivatedUniversityMessage = "This university portal is currently deactivated. Please contact your university administrator or UniStudents support.";

export async function getSessionContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase.from("user_roles").select("roles(name)").eq("user_id", user.id)
  ]);

  const roleNames = (roles ?? [])
    .map((item) => {
      const role = item.roles as { name?: UserRole } | null;
      return role?.name;
    })
    .filter(Boolean) as UserRole[];
  const isCompany = roleNames.includes("company");
  const isPlatformAdmin = roleNames.some((role) => platformRoles.includes(role));

  if (profile?.university_id && !isPlatformAdmin) {
    const { data: university } = await supabase
      .from("universities")
      .select("is_active")
      .eq("id", profile.university_id)
      .maybeSingle();

    if (university && !university.is_active) {
      await supabase.auth.signOut();
      redirect(`/login?error=deactivated`);
    }
  }

  const cookieStore = await cookies();
  const selectedUniversityId = cookieStore.get("unistudents_university_id")?.value || null;
  const effectiveUniversityId = isCompany ? selectedUniversityId : profile?.university_id ?? null;

  return {
    supabase,
    user,
    profile,
    roles: roleNames,
    isAdmin: roleNames.some((role) => adminRoles.includes(role)),
    isCompany,
    isPlatformAdmin,
    effectiveUniversityId
  };
}

export async function requireAdmin() {
  const context = await getSessionContext();
  if (!context.isAdmin) {
    redirect("/dashboard");
  }
  return context;
}

export async function redirectByRole() {
  const context = await getSessionContext();
  redirect(context.isAdmin ? "/admin" : "/dashboard");
}
