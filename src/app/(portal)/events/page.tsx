import { createEvent } from "@/app/actions";
import { cancelRsvp, rsvpEvent } from "@/app/actions";
import { getSessionContext } from "@/lib/auth";
import { formatDateTime } from "@/lib/date-format";
import { formatEuro, moneyInputPattern } from "@/lib/money";
import { canCreate } from "@/lib/permissions";
import { ActionForm } from "@/components/action-form";
import { ProviderInfo } from "@/components/provider-info";
import { CategoryFilter, SubNav } from "@/components/subnav";
import { CategoryLabel } from "@/components/category-icon";
import { EmptyState, Field, PageHeader, Panel, PrimaryButton, SelectField, TextArea } from "@/components/ui";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ tab?: string; category?: string }> }) {
  const { tab: requestedTab, category: activeCategory } = await searchParams;
  const { supabase, profile, roles, user } = await getSessionContext();
  const canCreateEvent = canCreate(roles, "events");
  const activeTab = requestedTab === "registered" || (requestedTab === "create" && canCreateEvent) ? requestedTab : "all";
  const nav = [
    { href: "/events", label: "All future events" },
    { href: "/events?tab=registered", label: "My registered events" },
    ...(canCreateEvent ? [{ href: "/events?tab=create", label: "Create event" }] : [])
  ];
  const eventSelect = "id,title,description,starts_at,location,event_type,price_cents,moderation_status,registration_type,external_registration_url,contact_email,contact_phone,created_by,image_url";
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
          .or(`auto_delete_at.is.null,auto_delete_at.gt.${new Date().toISOString()}`)
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
  const categories = visibleEvents.map((event) => String(event.event_type ?? "")).filter(Boolean);
  const filteredEvents = activeCategory
    ? visibleEvents.filter((event) => String(event.event_type ?? "") === activeCategory)
    : visibleEvents;
  const providerIds = Array.from(new Set(filteredEvents.map((event) => event.created_by).filter(Boolean).map(String)));
  const { data: providers } = providerIds.length
    ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", providerIds)
    : { data: [] };
  const providerById = new Map((providers ?? []).map((item) => [item.id, item]));

  return (
    <>
      <PageHeader title="Events" description="Browse approved events and submit new events for moderation." />
      <SubNav items={nav} active={activeTab} />
      {activeTab !== "create" ? <CategoryFilter basePath="/events" categories={categories} activeCategory={activeCategory} activeTab={activeTab} /> : null}
      <div className={activeTab === "create" ? "mx-auto max-w-2xl" : "grid gap-4 lg:grid-cols-[1fr_380px]"}>
        <div className="space-y-3">
          {activeTab !== "create" && filteredEvents?.length ? (
            filteredEvents.map((event) => (
              <Panel key={String(event.id)}>
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <a href={`/events/${String(event.id)}`} className="text-base font-semibold underline-offset-4 hover:underline">{String(event.title)}</a>
                    <div className="mt-2"><CategoryLabel category={String(event.event_type)} /></div>
                    {event.image_url ? <img src={String(event.image_url)} alt="" className="mt-4 max-h-64 w-full rounded-xl object-cover" /> : null}
                    <p className="mt-3 text-sm text-muted">{formatDateTime(String(event.starts_at))} · {String(event.location)}</p>
                    <p className="mt-1 text-sm font-medium">{formatEuro(event.price_cents as string | number | null)}</p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{String(event.description)}</p>
                    {String(event.registration_type ?? "internal_rsvp") === "internal_rsvp" ? (
                      <ActionForm action={registeredIds.has(String(event.id)) ? cancelRsvp : rsvpEvent} successMessage={registeredIds.has(String(event.id)) ? "Registration cancelled." : "Registration completed."} className="mt-4">
                        <input type="hidden" name="event_id" value={String(event.id)} />
                        <PrimaryButton>{registeredIds.has(String(event.id)) ? "Cancel registration" : "Register"}</PrimaryButton>
                      </ActionForm>
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
                  <ProviderInfo provider={(event.created_by ? providerById.get(String(event.created_by)) : null) as never} label="Posted by" />
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
            <ActionForm action={createEvent} successMessage="Event submitted and waiting for approval." resetOnSuccess className="mt-4 space-y-4">
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
              <Field label="Price" name="price_cents" placeholder="5 or 5,30" pattern={moneyInputPattern} inputMode="decimal" title="Use whole euros like 5 or euros and cents like 5,30." />
              <SelectField label="Registration type" name="registration_type" defaultValue="internal_rsvp">
                <option value="internal_rsvp">Internal RSVP</option>
                <option value="external_link">External link</option>
                <option value="contact_organizer">Contact organizer</option>
                <option value="none">None</option>
              </SelectField>
              <Field label="External registration URL" name="external_registration_url" type="url" />
              <Field label="Contact email" name="contact_email" type="email" />
              <Field label="Contact phone" name="contact_phone" />
              <Field label="Auto-delete deadline" name="auto_delete_at" type="datetime-local" />
              <label className="block">
                <span className="text-sm font-medium text-ink">Image</span>
                <input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="focus-ring mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm" />
              </label>
              <PrimaryButton>Submit for approval</PrimaryButton>
            </ActionForm>
          </Panel>
        ) : null}
      </div>
    </>
  );
}
