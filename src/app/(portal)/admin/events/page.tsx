import { requireAdmin } from "@/lib/auth";
import { ManagementTable } from "@/components/admin";
import { PageHeader } from "@/components/ui";
import { createServiceRoleClient } from "@/lib/supabase/admin";

function provider(item: Record<string, unknown>, field: "full_name" | "email") {
  const profile = item.profiles as { full_name?: string | null; email?: string | null } | null;
  return profile?.[field] ?? "";
}

function university(item: Record<string, unknown>) {
  const row = item.universities as { name?: string | null } | null;
  return row?.name ?? "";
}

export default async function AdminEventsPage() {
  const { profile, roles } = await requireAdmin();
  const adminClient = createServiceRoleClient();
  let query = adminClient
    .from("events")
    .select("id,title,description,starts_at,location,price_cents,capacity,moderation_status,profiles(full_name,email),universities(name)")
    .order("created_at", { ascending: false });
  if (!roles.includes("super_admin")) query = query.eq("university_id", profile?.university_id);
  const { data, error } = await query;
  const events = (data ?? []) as Array<Record<string, unknown>>;
  const eventIds = events.map((event) => String(event.id));
  const { data: rsvps } = eventIds.length
    ? await adminClient
        .from("event_rsvps")
        .select("event_id,user_id,status,created_at")
        .in("event_id", eventIds)
        .eq("status", "registered")
    : { data: [] };
  const rsvpUserIds = Array.from(new Set((rsvps ?? []).map((rsvp) => rsvp.user_id)));
  const { data: rsvpProfiles } = rsvpUserIds.length
    ? await adminClient.from("profiles").select("id,full_name,email,phone").in("id", rsvpUserIds)
    : { data: [] };
  const profileById = new Map((rsvpProfiles ?? []).map((item) => [item.id, item]));
  const rsvpsByEventId = new Map<string, Array<Record<string, unknown>>>();
  for (const rsvp of rsvps ?? []) {
    const participant = profileById.get(rsvp.user_id);
    const existing = rsvpsByEventId.get(rsvp.event_id) ?? [];
    existing.push({ ...rsvp, participant });
    rsvpsByEventId.set(rsvp.event_id, existing);
  }
  return (
    <>
      <PageHeader title="Event management" description="Review every submitted event. Approved and rejected items stay visible here." />
      {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</p> : (
        <ManagementTable
          title="Events"
          table="events"
          items={events}
          columns={[
            { key: "title", label: "Title/name" },
            { key: "description", label: "Description" },
            { key: "starts_at", label: "Date/time", render: (item) => item.starts_at ? new Date(String(item.starts_at)).toLocaleString() : "" },
            { key: "location", label: "Location" },
            { key: "created_by_name", label: "Created by", render: (item) => provider(item, "full_name") || provider(item, "email") },
            { key: "created_by_email", label: "Created by email", render: (item) => provider(item, "email") },
            { key: "price_cents", label: "Price/free", render: (item) => item.price_cents ? `EUR ${(Number(item.price_cents) / 100).toFixed(2)}` : "Free" },
            { key: "capacity", label: "Capacity" },
            { key: "university", label: "University", render: university },
            {
              key: "rsvps",
              label: "RSVPs",
              render: (item) => {
                const list = rsvpsByEventId.get(String(item.id)) ?? [];
                return (
                  <details>
                    <summary className="cursor-pointer font-medium">{list.length} RSVPs</summary>
                    <div className="mt-2 space-y-2">
                      {list.length ? list.map((rsvp) => {
                        const participant = rsvp.participant as { full_name?: string | null; email?: string | null; phone?: string | null } | undefined;
                        return (
                          <div key={`${String(rsvp.event_id)}-${String(rsvp.user_id)}`} className="rounded-lg bg-surface p-2">
                            <p className="font-medium">{participant?.full_name || participant?.email || "Unknown user"}</p>
                            {participant?.email ? <p className="text-xs text-muted">{participant.email}</p> : null}
                            {participant?.phone ? <p className="text-xs text-muted">{participant.phone}</p> : null}
                            <p className="text-xs text-muted">{rsvp.created_at ? new Date(String(rsvp.created_at)).toLocaleString() : ""}</p>
                          </div>
                        );
                      }) : <p className="text-xs text-muted">No registered participants.</p>}
                    </div>
                  </details>
                );
              }
            }
          ]}
        />
      )}
    </>
  );
}
