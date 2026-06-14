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
  const eventSelect = "id,title,description,starts_at,location,event_type,price_cents,moderation_status,registration_type,external_registration_url,contact_email,contact_phone,profiles(full_name,email,phone)";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureFrom = today.toISOString();
  const { data: events } = activeTab === "registered"
    ? await supabase
        .from("event_rsvps")
        .select(`status,events(${eventSelect})`)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .eq("events.moderation_status", "approved")
        .gte("events.starts_at", futureFrom)
        .order("created_at", { ascending: false })
    : activeTab === "all"
      ? await supabase
          .from("events")
          .select(eventSelect)
          .eq("moderation_status", "approved")
          .eq("university_id", profile?.university_id)
          .gte("starts_at", futureFrom)
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
                    {String(event.registration_type ?? "internal_rsvp") === "internal_rsvp" ? (
                      <form action={registeredIds.has(String(event.id)) ? cancelRsvp : rsvpEvent} className="mt-4">
                        <input type="hidden" name="event_id" value={String(event.id)} />
                        <PrimaryButton>{registeredIds.has(String(event.id)) ? "Cancel registration" : "Register"}</PrimaryButton>
                      </form>
                    ) : String(event.registration_type) === "external_link" && event.external_registration_url ? (
                      <a className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white" href={String(event.external_registration_url)} target="_blank" rel="noreferrer">
                        Register externally
                      </a>
                    ) : String(event.registration_type) === "contact_organizer" ? (
                      <details className="mt-4 rounded-lg bg-surface p-3 text-sm">
                        <summary className="cursor-pointer font-medium">Contact organizer</summary>
                        {event.contact_email ? <a className="mt-2 block text-muted underline" href={`mailto:${String(event.contact_email)}`}>{String(event.contact_email)}</a> : null}
                        {event.contact_phone ? <p className="mt-1 text-muted">{String(event.contact_phone)}</p> : null}
                      </details>
                    ) : null}
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
              <SelectField label="Registration type" name="registration_type" defaultValue="internal_rsvp">
                <option value="internal_rsvp">Internal RSVP</option>
                <option value="external_link">External link</option>
                <option value="contact_organizer">Contact organizer</option>
                <option value="none">None</option>
              </SelectField>
              <Field label="External registration URL" name="external_registration_url" type="url" />
              <Field label="Contact email" name="contact_email" type="email" />
              <Field label="Contact phone" name="contact_phone" />
              <PrimaryButton>Submit for approval</PrimaryButton>
            </form>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
