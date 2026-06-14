import { notFound } from "next/navigation";
import { cancelRsvp, reportContent, rsvpEvent } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-format";
import { formatEuro } from "@/lib/money";
import { ActionForm } from "@/components/action-form";
import { CategoryLabel } from "@/components/category-icon";
import { Field, PageHeader, Panel, PrimaryButton, TextArea } from "@/components/ui";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, effectiveUniversityId } = await getSessionContext();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("moderation_status", "approved")
    .eq("university_id", effectiveUniversityId)
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
      <PageHeader title={event.title} description={`${formatDateTime(event.starts_at)} · ${event.location}`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Panel>
          <CategoryLabel category={event.event_type} />
          {event.image_url ? <img src={event.image_url} alt="" className="mt-4 max-h-96 w-full rounded-xl object-cover" /> : null}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{event.description}</p>
          <p className="mt-4 text-sm">Capacity: {event.capacity ?? "No limit"}</p>
          <p className="mt-1 text-sm">Price: {formatEuro(event.price_cents)}</p>
        </Panel>
        <div className="space-y-4">
          <Panel>
            {(event.registration_type ?? "internal_rsvp") === "internal_rsvp" ? (
              rsvp?.status === "registered" ? (
              <ActionForm action={cancelRsvp} successMessage="Registration cancelled.">
                <input type="hidden" name="event_id" value={id} />
                <PrimaryButton>Cancel registration</PrimaryButton>
              </ActionForm>
            ) : (
              <ActionForm action={rsvpEvent} successMessage="Registration completed.">
                <input type="hidden" name="event_id" value={id} />
                <PrimaryButton>Register</PrimaryButton>
              </ActionForm>
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
            <ActionForm action={reportContent} successMessage="Report sent." resetOnSuccess className="mt-4 space-y-3">
              <input type="hidden" name="subject_type" value="event" />
              <input type="hidden" name="subject_id" value={id} />
              <Field label="Reason" name="reason" required />
              <PrimaryButton>Send report</PrimaryButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
