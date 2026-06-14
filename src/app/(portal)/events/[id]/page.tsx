import { notFound } from "next/navigation";
import { cancelRsvp, reportContent, rsvpEvent } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { Field, PageHeader, Panel, PrimaryButton, StatusBadge, TextArea } from "@/components/ui";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getSessionContext();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("moderation_status", "approved")
    .eq("university_id", profile?.university_id)
    .maybeSingle();

  if (!event) notFound();

  const { data: rsvp } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader title={event.title} description={`${new Date(event.starts_at).toLocaleString()} · ${event.location}`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel>
          <StatusBadge value={event.event_type} />
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{event.description}</p>
          <p className="mt-4 text-sm">Capacity: {event.capacity ?? "No limit"}</p>
          <p className="mt-1 text-sm">Price: {event.price_cents ? `EUR ${(event.price_cents / 100).toFixed(2)}` : "Free"}</p>
        </Panel>
        <div className="space-y-4">
          <Panel>
            {(event.registration_type ?? "internal_rsvp") === "internal_rsvp" ? (
              rsvp?.status === "registered" ? (
              <form action={cancelRsvp}>
                <input type="hidden" name="event_id" value={id} />
                <PrimaryButton>Cancel registration</PrimaryButton>
              </form>
            ) : (
              <form action={rsvpEvent}>
                <input type="hidden" name="event_id" value={id} />
                <PrimaryButton>Register</PrimaryButton>
              </form>
              )
            ) : event.registration_type === "external_link" && event.external_registration_url ? (
              <a className="focus-ring inline-flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-medium text-white" href={event.external_registration_url} target="_blank" rel="noreferrer">
                Register externally
              </a>
            ) : event.registration_type === "contact_organizer" ? (
              <div className="text-sm">
                <p className="font-medium">Contact organizer</p>
                {event.contact_email ? <a className="mt-2 block text-muted underline" href={`mailto:${event.contact_email}`}>{event.contact_email}</a> : null}
                {event.contact_phone ? <p className="mt-1 text-muted">{event.contact_phone}</p> : null}
              </div>
            ) : (
              <p className="text-sm text-muted">No registration is required.</p>
            )}
          </Panel>
          <Panel>
            <h2 className="font-semibold">Report event</h2>
            <form action={reportContent} className="mt-4 space-y-3">
              <input type="hidden" name="subject_type" value="event" />
              <input type="hidden" name="subject_id" value={id} />
              <Field label="Reason" name="reason" required />
              <PrimaryButton>Send report</PrimaryButton>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
