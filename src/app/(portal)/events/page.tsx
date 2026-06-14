import { createEvent } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { canCreate, noCreatePermissionMessage } from "@/lib/permissions";
import { ProviderInfo } from "@/components/provider-info";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, StatusBadge, TextArea } from "@/components/ui";

export default async function EventsPage() {
  const { supabase, profile, roles } = await getSessionContext();
  const canCreateEvent = canCreate(roles, "events");
  const { data: events } = await supabase
    .from("events")
    .select("id,title,description,starts_at,location,event_type,price_cents,moderation_status,profiles(full_name,email,phone,user_roles(roles(name)))")
    .eq("moderation_status", "approved")
    .eq("university_id", profile?.university_id)
    .order("starts_at");

  return (
    <>
      <PageHeader title="Events" description="Browse approved events and submit new events for moderation." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {events?.length ? (
            events.map((event) => (
              <a key={event.id} href={`/events/${event.id}`} className="block rounded-lg border border-line bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold">{event.title}</h2>
                      <StatusBadge value={event.event_type} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{new Date(event.starts_at).toLocaleString()} · {event.location}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{event.description}</p>
                  </div>
                  <ProviderInfo provider={event.profiles as never} label="Posted by" />
                </div>
              </a>
            ))
          ) : (
            <EmptyState title="No approved events yet" description="When approved events are added for your university, they will appear here." />
          )}
        </div>
        {canCreateEvent ? (
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
        ) : (
          <EmptyState title="Permission required" description={noCreatePermissionMessage("event")} />
        )}
      </div>
    </>
  );
}
