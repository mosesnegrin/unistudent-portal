import { redirect } from "next/navigation";
import { CalendarDays, HandCoins, MessagesSquare, NotebookTabs, ShoppingBag, TicketPercent } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";

export default async function DashboardPage() {
  const { supabase, profile, isAdmin } = await getSessionContext();
  if (isAdmin) redirect("/admin");

  const universityId = profile?.university_id;
  const now = new Date().toISOString();
  const [{ data: events }, { data: announcements }, { data: offers }, { data: siteTerms }] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,starts_at,location")
      .eq("moderation_status", "approved")
      .eq("university_id", universityId)
      .or(`auto_delete_at.is.null,auto_delete_at.gt.${now}`)
      .order("starts_at")
      .limit(3),
    supabase
      .from("announcements")
      .select("id,title,body,created_at,image_url,document_url,document_name")
      .eq("is_published", true)
      .or(`university_id.eq.${universityId},university_id.is.null`)
      .or(`auto_delete_at.is.null,auto_delete_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("offers")
      .select("id,title,partner_name,discount_details")
      .eq("moderation_status", "approved")
      .or(`university_id.eq.${universityId},is_austria_wide.eq.true`)
      .or(`auto_delete_at.is.null,auto_delete_at.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("app_settings")
      .select("key,value")
      .in("key", ["community_button_label", "community_button_url"])
  ]);
  const termMap = new Map((siteTerms ?? []).map((term) => [term.key, term.value]));
  const externalLabel = termMap.get("community_button_label")?.trim() || "Community";
  const externalUrl = termMap.get("community_button_url")?.trim() || "";

  const shortcuts = [
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/lessons", label: "Private lessons", icon: HandCoins },
    { href: "/materials", label: "Notes", icon: NotebookTabs },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/offers", label: "Offers", icon: TicketPercent }
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Your university updates, study resources, events, and student services in one place." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <SecondaryLink key={item.href} href={item.href}>
            <item.icon className="mr-2" size={18} />
            {item.label}
          </SecondaryLink>
        ))}
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex min-h-10 items-center justify-center rounded-lg border border-line bg-white px-3 text-sm font-medium transition hover:bg-surface"
          >
            <MessagesSquare className="mr-2" size={18} />
            {externalLabel}
          </a>
        ) : null}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel>
          <h2 className="font-semibold">Upcoming events</h2>
          {events?.length ? (
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <a key={event.id} href={`/events/${event.id}`} className="block rounded-lg bg-surface p-3">
                  <p className="font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-muted">{new Date(event.starts_at).toLocaleString()}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">No approved events yet.</p>
          )}
        </Panel>
        <Panel>
          <h2 className="font-semibold">Latest announcements</h2>
          {announcements?.length ? (
            <div className="mt-3 space-y-3">
              {announcements.map((item) => (
                <div key={item.id} className="rounded-lg bg-surface p-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted">{item.body}</p>
                  {item.image_url ? <img src={item.image_url} alt="" className="mt-3 max-h-40 w-full rounded-lg object-cover" /> : null}
                  {item.document_url ? <a href={item.document_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium underline">Download document</a> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">No announcements have been published yet.</p>
          )}
        </Panel>
        <Panel>
          <h2 className="font-semibold">Offers and discounts</h2>
          {offers?.length ? (
            <div className="mt-3 space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-lg bg-surface p-3">
                  <p className="font-medium">{offer.title}</p>
                  <p className="mt-1 text-sm text-muted">{offer.partner_name}: {offer.discount_details}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">No offers are available yet.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
