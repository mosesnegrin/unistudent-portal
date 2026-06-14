export type UserRole =
  | "student"
  | "tutor"
  | "notes_seller"
  | "event_creator"
  | "partner"
  | "university_admin"
  | "super_admin"
  | "company";

export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export type University = {
  id: string;
  name: string;
  allowed_email_domain: string;
  is_active: boolean;
  community_button_label?: string | null;
  community_button_url?: string | null;
};

export type Profile = {
  id: string;
  university_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  bio: string | null;
  is_active: boolean;
};

export type NavigationItem = {
  href: string;
  label: string;
};
