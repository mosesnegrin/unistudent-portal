"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionContext, requireAdmin } from "@/lib/auth";
import { isCompanyEmail } from "@/lib/email-domain";
import { canCreate, noCreatePermissionMessage } from "@/lib/permissions";
import { parseEuroInput } from "@/lib/money";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ModerationStatus, UserRole } from "@/lib/types";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function nullable(formData: FormData, key: string) {
  const item = value(formData, key);
  return item.length ? item : null;
}

function numberOrNull(formData: FormData, key: string) {
  const item = value(formData, key);
  return item.length ? Number(item) : null;
}

function moneyOrNull(formData: FormData, key: string) {
  return parseEuroInput(value(formData, key));
}

function isPlatformAdmin(roles: UserRole[]) {
  return roles.includes("super_admin") || roles.includes("company");
}

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const documentTypes = ["application/pdf", ...imageTypes];

async function uploadOptionalAsset(
  supabase: Awaited<ReturnType<typeof getSessionContext>>["supabase"],
  bucket: string,
  userId: string,
  formData: FormData,
  field: string,
  allowedTypes: string[]
) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Unsupported file type.");
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${crypto.randomUUID()}-${cleanName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, name: file.name };
}

export async function createEvent(formData: FormData) {
  const { supabase, user, profile, roles, effectiveUniversityId } = await getSessionContext();
  if (!canCreate(roles, "events")) throw new Error(noCreatePermissionMessage("event"));
  const universityId = effectiveUniversityId ?? profile?.university_id;
  if (!universityId) throw new Error("Select a university first.");
  const image = await uploadOptionalAsset(supabase, "event-assets", user.id, formData, "image", imageTypes);
  await supabase.from("events").insert({
    title: value(formData, "title"),
    description: value(formData, "description"),
    starts_at: value(formData, "starts_at"),
    location: value(formData, "location"),
    university_id: universityId,
    event_type: value(formData, "event_type"),
    capacity: numberOrNull(formData, "capacity"),
    price_cents: moneyOrNull(formData, "price_cents"),
    registration_type: value(formData, "registration_type") || "internal_rsvp",
    external_registration_url: nullable(formData, "external_registration_url"),
    contact_email: nullable(formData, "contact_email"),
    contact_phone: nullable(formData, "contact_phone"),
    auto_delete_at: nullable(formData, "auto_delete_at"),
    image_url: image?.url ?? null,
    created_by: user.id,
    moderation_status: "pending"
  });
  revalidatePath("/events");
}

export async function createLesson(formData: FormData) {
  const { supabase, user, profile, roles, effectiveUniversityId } = await getSessionContext();
  if (!canCreate(roles, "lessons")) throw new Error(noCreatePermissionMessage("lesson"));
  const universityId = effectiveUniversityId ?? profile?.university_id;
  if (!universityId) throw new Error("Select a university first.");
  await supabase.from("lessons").insert({
    course_name: value(formData, "course_name"),
    tutor_name: value(formData, "tutor_name"),
    grade_background: nullable(formData, "grade_background"),
    description: value(formData, "description"),
    price_cents: moneyOrNull(formData, "price_cents"),
    session_type: value(formData, "session_type"),
    availability: nullable(formData, "availability"),
    auto_delete_at: nullable(formData, "auto_delete_at"),
    university_id: universityId,
    created_by: user.id,
    moderation_status: "pending"
  });
  revalidatePath("/lessons");
}

export async function createMaterial(formData: FormData) {
  const { supabase, user, profile, roles, effectiveUniversityId } = await getSessionContext();
  if (!canCreate(roles, "materials")) throw new Error(noCreatePermissionMessage("material"));
  const universityId = effectiveUniversityId ?? profile?.university_id;
  if (!universityId) throw new Error("Select a university first.");
  const file = formData.get("file");
  let filePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    filePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from("materials").upload(filePath, file, {
      upsert: false
    });
    if (error) throw new Error(error.message);
  }

  await supabase.from("materials").insert({
    course_name: value(formData, "course_name"),
    title: value(formData, "title"),
    description: value(formData, "description"),
    file_path: filePath,
    is_free: value(formData, "is_free") === "true",
    price_cents: moneyOrNull(formData, "price_cents"),
    auto_delete_at: nullable(formData, "auto_delete_at"),
    university_id: universityId,
    created_by: user.id,
    moderation_status: "pending"
  });
  revalidatePath("/materials");
}

export async function createMarketplaceItem(formData: FormData) {
  const { supabase, user, profile, roles, effectiveUniversityId } = await getSessionContext();
  if (!canCreate(roles, "marketplace")) throw new Error(noCreatePermissionMessage("marketplace item"));
  const universityId = effectiveUniversityId ?? profile?.university_id;
  if (!universityId) throw new Error("Select a university first.");
  await supabase.from("marketplace_items").insert({
    title: value(formData, "title"),
    description: value(formData, "description"),
    price_cents: moneyOrNull(formData, "price_cents"),
    category: value(formData, "category"),
    auto_delete_at: nullable(formData, "auto_delete_at"),
    university_id: universityId,
    seller_id: user.id,
    moderation_status: "pending"
  });
  revalidatePath("/marketplace");
}

export async function updateProfile(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase
    .from("profiles")
    .update({
      full_name: value(formData, "full_name"),
      phone: nullable(formData, "phone")
    })
    .eq("id", user.id);

  revalidatePath("/profile");
}

export async function rsvpEvent(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase.from("event_rsvps").upsert({
    event_id: value(formData, "event_id"),
    user_id: user.id,
    status: "registered"
  });
  revalidatePath(`/events/${value(formData, "event_id")}`);
}

export async function cancelRsvp(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase
    .from("event_rsvps")
    .update({ status: "cancelled" })
    .eq("event_id", value(formData, "event_id"))
    .eq("user_id", user.id);
  revalidatePath(`/events/${value(formData, "event_id")}`);
}

export async function requestLesson(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase.from("lesson_requests").insert({
    lesson_id: value(formData, "lesson_id"),
    requester_id: user.id,
    message: nullable(formData, "message"),
    status: "pending"
  });
  revalidatePath("/lessons");
}

export async function requestMaterial(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase.from("material_requests").insert({
    material_id: value(formData, "material_id"),
    requester_id: user.id,
    message: nullable(formData, "message"),
    status: "pending"
  });
  revalidatePath("/materials");
}

export async function reportContent(formData: FormData) {
  const { supabase, user } = await getSessionContext();
  await supabase.from("reports").insert({
    reporter_id: user.id,
    subject_type: value(formData, "subject_type"),
    subject_id: value(formData, "subject_id"),
    reason: value(formData, "reason"),
    status: "open"
  });
  revalidatePath("/");
}

export async function moderateContent(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { profile, roles } = await requireAdmin();
    const table = value(formData, "table");
    const id = value(formData, "id");
    const status = value(formData, "status") as ModerationStatus;
    const allowedTables = ["events", "lessons", "materials", "marketplace_items", "offers", "guide_pages"];
    if (!allowedTables.includes(table)) return { ok: false, error: "Unsupported content type." };
    if (!id) return { ok: false, error: "Missing content id." };

    const serviceClient = createServiceRoleClient();
    const { data: record, error: readError } = await serviceClient
      .from(table)
      .select("id,university_id")
      .eq("id", id)
      .maybeSingle();

    if (readError) return { ok: false, error: readError.message };
    if (!record) return { ok: false, error: "This item no longer exists or was already removed." };
    if (!isPlatformAdmin(roles) && record.university_id !== profile?.university_id) {
      return { ok: false, error: "You can only manage content for your university." };
    }

    const update = table === "guide_pages"
      ? { is_published: status === "approved" }
      : { moderation_status: status, moderation_notes: nullable(formData, "notes") };
    const { error: updateError } = await serviceClient.from(table).update(update).eq("id", id);
    if (updateError) return { ok: false, error: updateError.message };

    revalidatePath("/admin");
    revalidatePath(`/admin/${table === "marketplace_items" ? "marketplace" : table}`);
    revalidatePath("/");
    if (table === "events") {
      revalidatePath("/events");
      revalidatePath("/dashboard");
    }
    if (table === "announcements") {
      revalidatePath("/dashboard");
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update content." };
  }
}

export async function moderateContentForm(formData: FormData): Promise<void> {
  await moderateContent(formData);
}

export async function createOffer(formData: FormData) {
  const { supabase, profile, roles, user } = await getSessionContext();
  if (!canCreate(roles, "offers")) throw new Error(noCreatePermissionMessage("offer"));
  const isPlatform = isPlatformAdmin(roles);
  const isAdmin = isPlatform || roles.includes("university_admin");
  const isAustriaWide = isPlatform && value(formData, "is_austria_wide") === "true";
  const [image, document] = await Promise.all([
    uploadOptionalAsset(supabase, "offer-assets", user.id, formData, "image", imageTypes),
    uploadOptionalAsset(supabase, "offer-assets", user.id, formData, "document", documentTypes)
  ]);
  await supabase.from("offers").insert({
    title: value(formData, "title"),
    description: value(formData, "description"),
    partner_name: value(formData, "partner_name"),
    discount_details: value(formData, "discount_details"),
    expires_at: nullable(formData, "expires_at"),
    link: nullable(formData, "link"),
    university_id: isPlatform ? nullable(formData, "university_id") : profile?.university_id,
    is_austria_wide: isAustriaWide,
    created_by: user.id,
    moderation_status: isAdmin ? "approved" : "pending",
    image_url: image?.url ?? null,
    document_url: document?.url ?? null,
    document_name: document?.name ?? null,
    auto_delete_at: nullable(formData, "auto_delete_at")
  });
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, profile, roles, user } = await requireAdmin();
  const [image, document] = await Promise.all([
    uploadOptionalAsset(supabase, "announcement-assets", user.id, formData, "image", imageTypes),
    uploadOptionalAsset(supabase, "announcement-assets", user.id, formData, "document", documentTypes)
  ]);
  await supabase.from("announcements").insert({
    title: value(formData, "title"),
    body: value(formData, "body"),
    university_id: isPlatformAdmin(roles) ? nullable(formData, "university_id") : profile?.university_id ?? null,
    created_by: user.id,
    is_published: value(formData, "is_published") === "true",
    image_url: image?.url ?? null,
    document_url: document?.url ?? null,
    document_name: document?.name ?? null,
    auto_delete_at: nullable(formData, "auto_delete_at")
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function createGuidePage(formData: FormData) {
  const { supabase, profile, roles, user } = await requireAdmin();
  const [image, document] = await Promise.all([
    uploadOptionalAsset(supabase, "guide-assets", user.id, formData, "image", imageTypes),
    uploadOptionalAsset(supabase, "guide-assets", user.id, formData, "document", documentTypes)
  ]);
  await supabase.from("guide_pages").insert({
    title: value(formData, "title"),
    category: value(formData, "category"),
    body: value(formData, "body"),
    university_id: isPlatformAdmin(roles) ? nullable(formData, "university_id") : profile?.university_id ?? null,
    created_by: user.id,
    is_published: value(formData, "is_published") === "true",
    image_url: image?.url ?? null,
    document_url: document?.url ?? null,
    document_name: document?.name ?? null,
    auto_delete_at: nullable(formData, "auto_delete_at")
  });
  revalidatePath("/admin");
  revalidatePath("/guide");
}

export async function createUniversity(formData: FormData) {
  const { supabase, roles } = await requireAdmin();
  if (!isPlatformAdmin(roles)) throw new Error("Only platform admins can create universities.");
  await supabase.from("universities").insert({
    name: value(formData, "name"),
    allowed_email_domain: value(formData, "allowed_email_domain").toLowerCase(),
    is_active: value(formData, "is_active") === "true"
  });
  revalidatePath("/admin/universities");
}

export async function toggleUniversityStatus(formData: FormData) {
  const { roles } = await requireAdmin();
  if (!isPlatformAdmin(roles)) throw new Error("Only platform admins can update universities.");
  const serviceClient = createServiceRoleClient();
  await serviceClient
    .from("universities")
    .update({ is_active: value(formData, "is_active") === "true" })
    .eq("id", value(formData, "id"));
  revalidatePath("/admin/universities");
  revalidatePath("/login");
}

export async function updateUniversityCommunity(formData: FormData) {
  const { profile, roles } = await requireAdmin();
  const universityId = value(formData, "id");
  const isPlatform = isPlatformAdmin(roles);
  if (!isPlatform && universityId !== profile?.university_id) {
    throw new Error("You can only update your university settings.");
  }
  const serviceClient = createServiceRoleClient();
  await serviceClient
    .from("universities")
    .update({
      community_button_label: value(formData, "community_button_label") || "Community",
      community_button_url: nullable(formData, "community_button_url")
    })
    .eq("id", universityId);
  revalidatePath("/admin/universities");
  revalidatePath("/dashboard");
}

export async function ensureCompanyRole() {
  const { supabase } = await getSessionContext();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email || !isCompanyEmail(user.email)) return;

  const serviceClient = createServiceRoleClient();
  const [{ data: profile }, { data: role }] = await Promise.all([
    serviceClient.from("profiles").select("id").eq("id", user.id).maybeSingle(),
    serviceClient.from("roles").select("id").eq("name", "company").maybeSingle()
  ]);

  if (profile && role) {
    await serviceClient.from("user_roles").upsert({
      user_id: user.id,
      role_id: role.id
    });
  }
}

export async function assignRole(formData: FormData) {
  const { supabase, roles } = await requireAdmin();
  if (!isPlatformAdmin(roles) && (value(formData, "role") === "super_admin" || value(formData, "role") === "company")) {
    throw new Error("Only platform admins can assign platform roles.");
  }
  const { data: role } = await supabase.from("roles").select("id").eq("name", value(formData, "role") as UserRole).single();
  if (role) {
    await supabase.from("user_roles").upsert({
      user_id: value(formData, "user_id"),
      role_id: role.id,
      assigned_by: (await supabase.auth.getUser()).data.user?.id
    });
  }
  revalidatePath("/admin/users");
}

export async function removeRole(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { data: role } = await supabase.from("roles").select("id").eq("name", value(formData, "role") as UserRole).single();
  if (role) {
    await supabase.from("user_roles").delete().eq("user_id", value(formData, "user_id")).eq("role_id", role.id);
  }
  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { user, roles } = await requireAdmin();
    if (!isPlatformAdmin(roles)) {
      return { ok: false, error: "Only platform admins can delete users." };
    }

    if (user.id === userId) {
      return { ok: false, error: "You cannot delete your own account from the admin dashboard." };
    }

    const serviceClient = createServiceRoleClient();
    const { error } = await serviceClient.auth.admin.deleteUser(userId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to delete user."
    };
  }
}

export async function deleteContent(table: string, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { profile, roles } = await requireAdmin();
    const allowedTables = ["events", "lessons", "materials", "marketplace_items", "offers", "announcements", "guide_pages"];
    if (!allowedTables.includes(table)) {
      return { ok: false, error: "Unsupported content type." };
    }

    const serviceClient = createServiceRoleClient();
    const { data: record, error: readError } = await serviceClient
      .from(table)
      .select("university_id")
      .eq("id", id)
      .maybeSingle();

    if (readError) return { ok: false, error: readError.message };
    if (!record) return { ok: false, error: "This item no longer exists or was already removed." };
    if (!isPlatformAdmin(roles) && record.university_id !== profile?.university_id) {
      return { ok: false, error: "You can only delete content for your university." };
    }

    const { error } = await serviceClient.from(table).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    revalidatePath(`/admin/${table === "marketplace_items" ? "marketplace" : table}`);
    revalidatePath("/");
    if (table === "events") {
      revalidatePath("/events");
      revalidatePath("/dashboard");
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to delete content." };
  }
}

export async function updateGuidePage(formData: FormData) {
  const { supabase, profile, roles, user } = await requireAdmin();
  const [image, document] = await Promise.all([
    uploadOptionalAsset(supabase, "guide-assets", user.id, formData, "image", imageTypes),
    uploadOptionalAsset(supabase, "guide-assets", user.id, formData, "document", documentTypes)
  ]);
  const updates: Record<string, string | boolean | null> = {
    title: value(formData, "title"),
    category: value(formData, "category"),
    body: value(formData, "body"),
    is_published: value(formData, "is_published") === "true",
    university_id: isPlatformAdmin(roles) ? nullable(formData, "university_id") : profile?.university_id ?? null,
    auto_delete_at: nullable(formData, "auto_delete_at")
  };
  if (image) updates.image_url = image.url;
  if (document) {
    updates.document_url = document.url;
    updates.document_name = document.name;
  }
  await supabase.from("guide_pages").update(updates).eq("id", value(formData, "id"));
  revalidatePath("/admin/guide");
  revalidatePath("/guide");
}

export async function updateAppSetting(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from("app_settings").upsert({
    key: value(formData, "key"),
    value: value(formData, "value"),
    description: nullable(formData, "description")
  });
  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
}

export async function goDashboard() {
  redirect("/dashboard");
}
