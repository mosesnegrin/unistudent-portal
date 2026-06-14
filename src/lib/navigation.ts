import type { NavigationItem } from "./types";

export const studentNavigation: NavigationItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/lessons", label: "Lessons" },
  { href: "/materials", label: "Materials" },
  { href: "/marketplace", label: "Market" },
  { href: "/offers", label: "Offers" },
  { href: "/guide", label: "Guide" },
  { href: "/profile", label: "Profile" }
];

export function getAdminNavigation(isSuperAdmin: boolean): NavigationItem[] {
  return [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/lessons", label: "Lessons" },
  { href: "/admin/marketplace", label: "Market" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/universities", label: "Universities" },
  ...(isSuperAdmin ? [{ href: "/admin/terms", label: "Terms" }] : [])
  ];
}
