import type { UserRole } from "@/lib/types";

export type CreationPermission = "events" | "lessons" | "materials" | "marketplace" | "offers";

export const creationRoleMap: Record<CreationPermission, UserRole[]> = {
  events: ["event_creator", "university_admin", "super_admin", "company"],
  lessons: ["tutor", "university_admin", "super_admin", "company"],
  materials: ["notes_seller", "university_admin", "super_admin", "company"],
  marketplace: ["student", "university_admin", "super_admin", "company"],
  offers: ["partner", "university_admin", "super_admin", "company"]
};

export function hasAnyRole(userRoles: UserRole[], allowedRoles: UserRole[]) {
  return userRoles.some((role) => allowedRoles.includes(role));
}

export function canCreate(userRoles: UserRole[], permission: CreationPermission) {
  return hasAnyRole(userRoles, creationRoleMap[permission]);
}

export function noCreatePermissionMessage(contentType: string) {
  return `You do not have permission to create this ${contentType}.`;
}
