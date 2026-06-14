import { createEvent } from "@/app/actions";
import { cancelRsvp, rsvpEvent } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { SubNav } from "@/components/subnav";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requestedTab } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateEvent = canCreate(roles, "events");
  const activeTab = requestedTab === "registered" || (requestedTab === "create" && canCreateEvent) ? requestedTab : "all";
  const nav = [
    { href: "/events", label: "All future events" },
    { href: "/events?tab=registered", label: "My registered events" },
    ...(canCreateEvent ? [{ href: "/events?tab=create", label: "Create event" }] : [])
  ];
  const eventSelect = "id,title,description,starts_at,location,event_type,price_cents,moderation_status,profiles(full_name,email,phone,user_roles(roles(name)))";
  const now = new Date().toISOString();
  const { data: events } = activeTab === "registered"
    ? await supabase
        .from("event_rsvps")
        .select(`status,events(${eventSelect})`)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .eq("events.moderation_status", "approved")
        .gte("events.starts_at", now)
        .order("created_at", { ascending: false })
    : activeTab === "all"
      ? await supabase
          .from("events")
          .select(eventSelect)
          .eq("moderation_status", "approved")
          .eq("university_id", profile?.university_id)
          .gte("starts_at", now)
          .order("starts_at")
      : { data: [] };
  const { data: myRsvps } = await supabase.from("event_rsvps").select("event_id,status").eq("user_id", user.id).eq("status", "registered");
  const registeredIds = new Set((myRsvps ?? []).map((item) => item.event_id));
  const visibleEvents = (activeTab === "registered"
    ? ((events ?? []) as Array<Record<string, unknown>>).map((item) => {
        const event = item.events as Record<string, unknown> | Record<string, unknown>[] | null;
        return Array.isArray(event) ? event[0] : event;
      })
    : ((events ?? []) as Array<Record<string, unknown>>)
  ).filter(Boolean) as Array<Record<string, unknown>>;

  return (
    <>
      <PageHeader title="Events" description="Browse approved events and submit new events for moderation." />
      <SubNav items={nav} active={activeTab} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {activeTab !== "create" && visibleEvents?.length ? (
            visibleEvents.map((event) => (
              <Panel key={String(event.id)}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <a href={`/events/${String(event.id)}`} className="font-semibold underline-offset-4 hover:underline">{String(event.title)}</a>
                      <StatusBadge value={String(event.event_type)} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{new Date(String(event.starts_at)).toLocaleString()} · {String(event.location)}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{String(event.description)}</p>
                    <form action={registeredIds.has(String(event.id)) ? cancelRsvp : rsvpEvent} className="mt-4">
                      <input type="hidden" name="event_id" value={String(event.id)} />
                      <PrimaryButton>{registeredIds.has(String(event.id)) ? "Cancel registration" : "Register"}</PrimaryButton>
                    </form>
                  </div>
                  <ProviderInfo provider={event.profiles as never} label="Posted by" />
                </div>
              </Panel>
            ))
          ) : (
            activeTab !== "create" ? <EmptyState title="No events found" description="Approved future events for this view will appear here." /> : null
          )}
        </div>
        {activeTab === "create" && canCreateEvent ? (
          <Panel>
            <h2 className="font-semibold">Submit event</h2>
            <form action={createEvent} className="mt-4 space-y-4">
              <Field label="Title" name="title" required />
              <TextArea label="Description" name="description" required />
              <Field label="Date and time" name="starts_at" type="datetime-local" required />
              <Field label="Location" name="location" required />
              <SelectField label="Event type" name="event_type" required defaultValue="student_event">
                <option value="student_event">Student event</option>
                <option value="university_event">University/student-union event</option>
                <option value="external_partner_event">External partner event</option>
              </SelectField>
              <Field label="Capacity" name="capacity" type="number" />
              <Field label="Price in cents" name="price_cents" type="number" placeholder="0 for free" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
