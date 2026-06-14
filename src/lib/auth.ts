import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export const adminRoles: UserRole[] = ["university_admin", "super_admin"];

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

  return {
    supabase,
    user,
    profile,
    roles: roleNames,
    isAdmin: roleNames.some((role) => adminRoles.includes(role))
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
