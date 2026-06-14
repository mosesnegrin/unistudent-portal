import { redirect } from "next/navigation";
import { CalendarDays, HandCoins, MessagesSquare, NotebookTabs, ShoppingBag, TicketPercent } from "lucide-react";
import { getSessionContext } from "@/lib/auth";
import { PageHeader, Panel, SecondaryLink } from "@/components/ui";

export default async function DashboardPage() {
  const { supabase, profile, isAdmin } = await getSessionContext();
  if (isAdmin) redirect("/admin");

  const universityId = profile?.university_id;
  const [{ data: events }, { data: announcements }, { data: offers }] = await Promise.all([
    supabase
      .from("events")
      .select("id,title,starts_at,location")
      .eq("moderation_status", "approved")
      .eq("university_id", universityId)
      .order("starts_at")
      .limit(3),
    supabase
      .from("announcements")
      .select("id,title,body,created_at")
      .eq("is_published", true)
      .or(`university_id.eq.${universityId},university_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("offers")
      .select("id,title,partner_name,discount_details")
      .or(`university_id.eq.${universityId},is_austria_wide.eq.true`)
      .order("created_at", { ascending: false })
      .limit(3)
  ]);

  const shortcuts = [
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/lessons", label: "Private lessons", icon: HandCoins },
    { href: "/materials", label: "Notes", icon: NotebookTabs },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/offers", label: "Offers", icon: TicketPercent },
    { href: "/community", label: "Community", icon: MessagesSquare }
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Your university updates, study resources, events, and student community in one place." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts.map((item) => (
          <SecondaryLink key={item.href} href={item.href}>
            <item.icon className="mr-2" size={18} />
            {item.label}
          </SecondaryLink>
        ))}
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
